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

type InventoryAvailabilityCheckResponse = {
    available: boolean;
    items: {
        productId: string;
        requested: number;
        availableQuantity: number;
        available: boolean;
    }[];
};

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private packageRepository: Repository<OrderItem>,
        @InjectRepository(SubOrder) private subOrderRepository: Repository<SubOrder>,
        @InjectRepository(SubOrderItem) private subOrderItemRepository: Repository<SubOrderItem>,
        @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
        @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy
    ) {}

    /**
     * ORDERTYPE -> selling
     * 1. Cassa istantanea: nessun pre-check disponibilità; scalo diretto su inventario.
     * 2. Altri flussi: check disponibilità opzionale poi riserva giacenza.
     * Una SubOrder operativa per ordine (righe collegate); suddivisione per reparto si potrà aggiungere in seguito.
     */
    async createOrder(order: CreateOrderDto): Promise<Order> {
        try {
            if (this._mustCheckAvailability(order)) {
                const availability = await this._checkInventoryAvailability(order);
                if (!availability.available) {
                    const unavailableItems = availability.items.filter((item) => !item.available);
                    throw new BadRequestException({
                        message: 'Disponibilita insufficiente per uno o piu articoli',
                        items: unavailableItems
                    });
                }
            }

            if (order.fulfillmentMode === OrderFullfilmentMode.instant) {
                const paymentCorrect =
                    (order.paymentStatus === OrderPaymentStatus.paid)
                    && (order.paymentId != null);

                if (!paymentCorrect) {
                    throw new HttpException('Stato di pagamento non conforme', HttpStatus.BAD_REQUEST);
                }
            }

            const totalSum = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const orderItems = order.orderItems.map(p =>
                this.packageRepository.create({
                    ...p
                })
            );

            const { paymentId, orderItems: _dtoItems, ...orderFields } = order;
            if (paymentId) {
                const paymentRow = await this.paymentRepository.findOne({
                    where: { paymentId },
                });
                if (!paymentRow) {
                    throw new BadRequestException(`Pagamento ${paymentId} non trovato`);
                }
            }

            const query = this.orderRepository.create({
                ...orderFields,
                totalAmount: totalSum,
                orderItems: orderItems,
                ...(paymentId ? { payment: { paymentId } as Payment } : {}),
            });
            const saved = await this.orderRepository.save(query);

            try {
                await this._createOperationalSubOrders(saved);
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
            const err = e as { response?: unknown; status?: number; message?: string };
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
            && originalDto.fulfillmentMode === OrderFullfilmentMode.instant;

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
        return !(order.orderType === OrderType.selling && order.fulfillmentMode === OrderFullfilmentMode.instant);
    }

    private async _checkInventoryAvailability(order: CreateOrderDto): Promise<InventoryAvailabilityCheckResponse> {
        return await firstValueFrom(
            this.inventoryClient.send(
                { cmd: InventoryCommand.checkAvailability },
                {
                    marketId: order.marketId,
                    items: order.orderItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                }
            ).pipe(timeout(2500))
        ) as InventoryAvailabilityCheckResponse;
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
        const merged = this.orderRepository.merge(order, rest);
        if (paymentId !== undefined) {
            if (paymentId) {
                const paymentRow = await this.paymentRepository.findOne({
                    where: { paymentId },
                });
                if (!paymentRow) {
                    throw new BadRequestException(`Pagamento ${paymentId} non trovato`);
                }
                merged.payment = paymentRow;
            } else {
                merged.payment = null;
            }
        }
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
