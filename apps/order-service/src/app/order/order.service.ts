import { BadRequestException, GatewayTimeoutException, HttpException, HttpStatus, Inject, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CreateOrderDto, OrderFullfilmentMode, OrderPaymentStatus, OrderStatus, OrderType } from "@retail-system/shared";
import { Order } from "../database/entities/order";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderItem } from "../database/entities/order_item";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, TimeoutError, timeout } from "rxjs";

type InventoryAvailabilityCheckResponse = {
    available: boolean;
    items: { productId: string; requested: number; availableQuantity: number; available: boolean }[];
};

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private packageRepository: Repository<OrderItem>,
        @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy
    ) {}

    /**
     * 
     * @param order 
     * @returns 
     * 
     * ORDERTYPE -> selling
     * 
     * 1. Se pago in contanti: controllo disponibilità? No, scalo e basta. Controllo di avere la ricevuta di pagamento e contabilizzo.
     * 2. Se compro per il magazzino, arrivo: (fase1)
     *      2.1 fulfillmentMode -> pickup
     *      2.2 OrderStatus -> open
     *      2.3 paymentStatus -> pending
     *      (fase 2)
     *      2.4 OrderStatus -> reserved/ready
     *      2.5 paymentStatus -> paid
     *      (fase 3)
     *      2.6 se e solo paymentStatus == paid, OrderStatus -> completed
     *      2.7 scalo in inventario la colonna total e researved delle giacenze
     * 3. Se compro online è più semplice
     *      3.1 genero ordine orderStatus -> open
     *      3.2 effettuo il pagamento, paymentStatus -> paid
     *      3.3 orderStatus -> ready/shipped/completed
     */
    async createOrder(order: CreateOrderDto): Promise<Order> {
        try {
            if (this.mustCheckAvailability(order)) {
                const availability = await this.checkInventoryAvailability(order);
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
            const query = this.orderRepository.create({
                ...order,
                totalAmount: totalSum,
                orderItems: orderItems
            });
            return await this.orderRepository.save(query);
        } catch (e: any) {
            if (e instanceof TimeoutError) {
                throw new GatewayTimeoutException('Inventory service timeout durante verifica disponibilita');
            }
            if (e?.code === 'ECONNREFUSED' || e?.message?.includes('ECONNREFUSED')) {
                throw new ServiceUnavailableException('Inventory service non raggiungibile');
            }
            if (e?.response) {
                throw new HttpException(
                    e.response,
                    e.status ?? e.response.status ?? 500
                );
            } 
            throw new HttpException('Errore interno di creazione ordine', 500);
        }
    }

    private mustCheckAvailability(order: CreateOrderDto): boolean {
        // Vendita in contanti "istantanea": scalo diretto senza pre-check.
        return !(order.orderType === OrderType.selling && order.fulfillmentMode === OrderFullfilmentMode.instant);
    }

    private async checkInventoryAvailability(order: CreateOrderDto): Promise<InventoryAvailabilityCheckResponse> {
        return await firstValueFrom(
            this.inventoryClient.send(
                { cmd: 'check_availability' },
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
                orderItems: true
            }
        });
    }

    async getOrderById(orderId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { orderId },
            relations: {
                orderItems: true
            }
        });

        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found`);
        }

        return order;
    }

    async updateOrder(orderId: string, payload: Partial<CreateOrderDto>): Promise<Order> {
        const order = await this.getOrderById(orderId);
        const merged = this.orderRepository.merge(order, payload);
        return this.orderRepository.save(merged);
    }

    async deleteOrder(orderId: string): Promise<{ message: string }> {
        const order = await this.getOrderById(orderId);
        await this.orderRepository.remove(order);
        return { message: `Order ${orderId} deleted` };
    }
}