import {
    BadRequestException,
    GatewayTimeoutException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
    ServiceUnavailableException,
} from "@nestjs/common";
import {
    CreateOrderDto,
    CreateSubOrderDto,
    InventoryCommand,
    OrderFullfilmentMode,
    OrderPaymentStatus,
    OrderType,
    PhysicalSubOrderStatus,
} from "@retail-system/shared";
import { Order } from "../database/entities/order";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderItem } from "../database/entities/order_item";
import { Payment } from "../database/entities/payment";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, TimeoutError, timeout } from "rxjs";
import { SubOrder } from "../database/entities/sub_order";
import { SubOrderItem } from "../database/entities/sub_order_item";
import { CommInventoryService } from "./comm-inventory.service";

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private packageRepository: Repository<OrderItem>,
        @InjectRepository(SubOrder) private subOrderRepository: Repository<SubOrder>,
        @InjectRepository(SubOrderItem) private subOrderItemRepository: Repository<SubOrderItem>,
        @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
        @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
        private commInventoryService: CommInventoryService
    ) {}

    /**
     * ORDERTYPE -> selling
     * 1. Cassa istantanea: nessun pre-check disponibilità; scalo diretto su inventario.
     * 2. Altri flussi: check disponibilità opzionale poi riserva giacenza.
     * Una SubOrder operativa per ordine (righe collegate); suddivisione per reparto si potrà aggiungere in seguito.
     */
    async createOrder(order: CreateOrderDto): Promise<Order> {
        try {
            const lineItems = order.orderItems ?? [];

            //
            //  L'ordine non può essere vuoto e nemmeno i suborder non posso avere items == 0
            if (
                lineItems.length === 0
                && order.subOrders?.some((s) => (s.items?.length ?? 0) > 0)
            ) {
                throw new BadRequestException(
                    'Righe sub-ordine con orderItemId richiedono righe ordine: crea prima gli articoli o invia sub-ordini senza righe.',
                );
            }

            //
            //  Controllo che gli articoli siano effettivamente presenti
            if (this._mustCheckAvailability(order)) {
                const availability = await this.commInventoryService.checkInventoryAvailability(order);
                if (!availability.available) {
                    const unavailableItems = availability.items.filter((item) => !item.available);
                    throw new BadRequestException({
                        message: 'Disponibilita insufficiente per uno o piu articoli',
                        items: unavailableItems
                    });
                }
            }

            //
            //  Controllo che se acquisto in negozio il pagamento sia stato effettuato
            const hasLineItems = lineItems.length > 0;
            const paymentIdNormalized = order.paymentId?.trim() || undefined;
            const effectivePaymentStatus = order.paymentStatus ?? OrderPaymentStatus.pending;

            if (order.fulfillmentMode === OrderFullfilmentMode.shop && hasLineItems) {
                const paymentCorrect = (order.paymentStatus === OrderPaymentStatus.paid) && paymentIdNormalized != null;

                if (!paymentCorrect) {
                    throw new HttpException('Stato di pagamento non conforme', HttpStatus.BAD_REQUEST);
                }
            }

            const totalSum = lineItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const orderItems = lineItems.map(p =>
                this.packageRepository.create({
                    ...p
                })
            );

            const { paymentId, orderItems: _dtoItems, subOrders: _subOrdersDto, ...orderFields } = order;
            let paymentRow: Payment | null = null;

            if (paymentIdNormalized) {
                const found = await this.paymentRepository.findOne({
                    where: { paymentId: paymentIdNormalized },
                });
                if (!found) {
                    throw new BadRequestException(`Pagamento ${paymentIdNormalized} non trovato`);
                }
                paymentRow = found;
            }
            this._ensurePaidOrderHasPayment(effectivePaymentStatus, paymentRow);

            const query = this.orderRepository.create({
                ...orderFields,
                totalAmount: totalSum,
                orderItems: orderItems,
                ...(paymentRow ? { payment: paymentRow } : {}),
            });
            const saved = await this.orderRepository.save(query);

            try {
                if (hasLineItems) {
                    await this._createOperationalSubOrders(saved);
                } else if (order.subOrders?.length) {
                    await this._persistVacantSubOrders(saved.orderId, order.subOrders);
                }
                await this._applyStockForOrder(saved, order);
            } catch (inner: unknown) {
                await this.orderRepository.delete({ orderId: saved.orderId });
                throw inner;
            }

            return this.getOrderById(saved.orderId);
        } catch (e: unknown) {
            if (e instanceof TimeoutError) {
                throw new GatewayTimeoutException('Inventory service timeout durante operazione su inventario');
            }
            if (this._isConnectionRefused(e)) {
                throw new ServiceUnavailableException('Inventory service non raggiungibile');
            }
            if (e instanceof HttpException || e instanceof BadRequestException) {
                throw e;
            }
            const err = e as { 
                response?: unknown; 
                status?: number; 
                message?: string 
            };

            if (err?.response !== undefined) {
                throw new HttpException(
                    err.response,
                    err.status ?? HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw new HttpException('Errore interno di creazione ordine', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private _isConnectionRefused(e: unknown): boolean {
        const err = e as { code?: string; message?: string };
        return err?.code === 'ECONNREFUSED' || Boolean(err?.message?.includes('ECONNREFUSED'));
    }

    /**
     * `payment_status` non può essere `paid` se `payment_id` è assente (nessun Payment collegato).
     */
    private _ensurePaidOrderHasPayment(
        paymentStatus: OrderPaymentStatus | undefined,
        payment: Payment | null | undefined,
    ): void {
        if (paymentStatus !== OrderPaymentStatus.paid) {
            return;
        }
        const id = payment?.paymentId?.trim();

        if (id == null || id === '') {
            throw new BadRequestException(
                'payment_status non può essere paid finché payment_id è vuoto: creare il Payment e passare paymentId.',
            );
        }
    }

    private async _createOperationalSubOrders(order: Order): Promise<void> {
        const full = await this.orderRepository.findOne({
            where: { orderId: order.orderId },
            relations: { orderItems: true },
        });
        if (!full?.orderItems?.length) {
            return;
        }

        const productIds = full.orderItems.map((i) => i.productId);
        await firstValueFrom(
            this.inventoryClient.send(
                { cmd: InventoryCommand.validateOrderProducts },
                { productIds }
            ).pipe(timeout(2500))
        );

        const isPaid = full.paymentStatus === OrderPaymentStatus.paid;

        const sub = this.subOrderRepository.create({
            parentOrderId: full.orderId,
            physicalStatus: PhysicalSubOrderStatus.PENDING,
            isPaid,
            items: full.orderItems.map((line) =>
                this.subOrderItemRepository.create({
                    orderItemId: line.orderItemId,
                    quantity: line.quantity,
                }),
            ),
        });
        await this.subOrderRepository.save(sub);
    }

    /** Sub-ordini inviati con ordine vacante: solo gusci (senza righe SubOrderItem) finché non esistono OrderItem. */
    private async _persistVacantSubOrders(
        orderId: string,
        subOrders: CreateSubOrderDto[],
    ): Promise<void> {
        for (const sub of subOrders) {
            const { parentOrderId: _ignoredParent, items = [], ...rest } = sub;
            const entity = this.subOrderRepository.create({
                ...rest,
                parentOrderId: orderId,
                items: items.map((line) =>
                    this.subOrderItemRepository.create({
                        orderItemId: line.orderItemId,
                        quantity: line.quantity,
                    }),
                ),
            });
            await this.subOrderRepository.save(entity);
        }
    }

    private async _applyStockForOrder(persisted: Order, originalDto: CreateOrderDto): Promise<void> {
        const full = await this.orderRepository.findOne({
            where: { orderId: persisted.orderId },
            relations: { orderItems: true },
        });
        if (!full?.orderItems?.length) {
            return;
        }
        const items = full.orderItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
        }));
        const isInstant =
            originalDto.orderType === OrderType.selling
            && originalDto.fulfillmentMode === OrderFullfilmentMode.shop;

        if (isInstant) {
            await firstValueFrom(
                this.inventoryClient.send(
                    { cmd: InventoryCommand.deductInstantSale },
                    {
                        marketId: full.marketId,
                        orderId: full.orderId,
                        items,
                    }
                ).pipe(timeout(2500))
            );
        } else {
            await firstValueFrom(
                this.inventoryClient.send(
                    { cmd: InventoryCommand.reserveStockForOrder },
                    {
                        marketId: full.marketId,
                        orderId: full.orderId,
                        items,
                    }
                ).pipe(timeout(2500))
            );
        }
    }

    private _mustCheckAvailability(order: CreateOrderDto): boolean {
        return !(order.orderType === OrderType.selling && order.fulfillmentMode === OrderFullfilmentMode.shop);
    }

    /**
     * In cassa: associa il suborder all’ordine e valida che ogni riga suborder punti a OrderItem
     * già appartenenti a questo ordine (dati prodotto/prezzo solo su OrderItem).
     * Ricalcola `totalAmount` dalle righe ordine.
     */
    async materializeSubOrderToOrderItems(
        orderId: string,
        subOrderId: string,
    ): Promise<Order> {
        const sub = await this.subOrderRepository.findOne({
            where: { subOrderId },
            relations: { items: true },
        });
        if (!sub) {
            throw new NotFoundException(`Sub-ordine ${subOrderId} non trovato`);
        }
        if (sub.parentOrderId != null && sub.parentOrderId !== orderId) {
            throw new BadRequestException(
                'Sub-ordine già associato ad un altro ordine',
            );
        }

        for (const row of sub.items ?? []) {
            const oi = await this.packageRepository.findOne({
                where: { orderItemId: row.orderItemId },
            });
            if (!oi) {
                throw new BadRequestException(
                    `OrderItem ${row.orderItemId} non trovato`,
                );
            }
            if (oi.orderId !== orderId) {
                throw new BadRequestException(
                    `La riga sub-ordine ${row.subOrderItemId} punta a un articolo che non appartiene all'ordine ${orderId}`,
                );
            }
        }

        sub.parentOrderId = orderId;
        await this.subOrderRepository.save(sub);

        const order = await this.getOrderById(orderId);
        const total = (order.orderItems ?? []).reduce(
            (acc, i) => acc + Number(i.price) * i.quantity,
            0,
        );
        order.totalAmount = total;
        await this.orderRepository.save(order);

        return this.getOrderById(orderId);
    }

    async getAllOrders(): Promise<Order[]> {
        return this.orderRepository.find({
            relations: {
                orderItems: true,
                subOrders: { items: true },
                payment: true,
            }
        });
    }

    async getOrderById(orderId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { orderId },
            relations: {
                orderItems: true,
                subOrders: { items: true },
                payment: true,
            }
        });

        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found`);
        }

        return order;
    }

    async updateOrder(orderId: string, payload: Partial<CreateOrderDto>): Promise<Order> {
        const order = await this.getOrderById(orderId);
        const wasPaid = order.paymentStatus === OrderPaymentStatus.paid;
        const { paymentId, ...rest } = payload;
        const paymentIdNormalized = (paymentId !== undefined) ? (paymentId?.trim() || undefined) : undefined;
        const merged = this.orderRepository.merge(order, rest);

        if (paymentId !== undefined) {
            if (paymentIdNormalized) {
                const paymentRow = await this.paymentRepository.findOne({
                    where: { paymentId: paymentIdNormalized },
                });
                if (!paymentRow) {
                    throw new BadRequestException(`Pagamento ${paymentIdNormalized} non trovato`);
                }
                merged.payment = paymentRow;
            } else {
                merged.payment = null;
            }
        }
        const effectiveStatus =
            merged.paymentStatus ?? OrderPaymentStatus.pending;
        this._ensurePaidOrderHasPayment(effectiveStatus, merged.payment);

        const saved = await this.orderRepository.save(merged);
        const isPaid = saved.paymentStatus === OrderPaymentStatus.paid;

        if (!wasPaid && isPaid) {
            await this.subOrderRepository.update(
                { parentOrderId: orderId },
                { isPaid: true },
            );
        } else if (wasPaid && !isPaid) {
            await this.subOrderRepository.update(
                { parentOrderId: orderId },
                { isPaid: false },
            );
        }
        return this.getOrderById(orderId);
    }

    async deleteOrder(orderId: string): Promise<{ message: string }> {
        await this.getOrderById(orderId);
        try {
            await firstValueFrom(
                this.inventoryClient.send(
                    { cmd: InventoryCommand.releaseStockForOrder },
                    { orderId }
                ).pipe(timeout(2500))
            );
        } catch (e: unknown) {
            if (e instanceof TimeoutError) {
                throw new GatewayTimeoutException('Inventory service timeout durante rilascio giacenza');
            }
            if (this._isConnectionRefused(e)) {
                throw new ServiceUnavailableException('Inventory service non raggiungibile');
            }
            throw e;
        }
        await this.orderRepository.delete(orderId);
        return { message: `Order ${orderId} deleted` };
    }
}
