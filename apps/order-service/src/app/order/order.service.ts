import { HttpException, Injectable } from "@nestjs/common";
import { ApiResponse, CreateOrderDto, OrderPaymentStatus, OrderStatus, OrderType, PackageStatus } from "@retail-system/shared";
import { Order } from "../database/entities/order";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpStatusCode } from "axios";
import { OrderItem } from "../database/entities/order_item";

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private packageRepository: Repository<OrderItem>
    ) {}

    async createOrder(order: CreateOrderDto): Promise<Order> {
        try {
            const totalSum = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const orderItems = order.orderItems.map(p => {
                return this.packageRepository.create({
                    orderItemId: crypto.randomUUID(),    
                    ...p
                });
            });
            const query = await this.orderRepository.create({
                ...order,
                totalAmount: totalSum,
                orderItems: orderItems
            }); 
            return await this.orderRepository.save(query);
        } catch (e) {
            if (e.response) {
                throw new HttpException(
                    e.response.data,
                    e.response.status
                );
            }
            throw new HttpException('Errore interno del Gateway', 500);
        }
    }
}