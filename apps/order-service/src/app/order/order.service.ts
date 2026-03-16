import { Injectable } from "@nestjs/common";
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

    async createOrder(order: CreateOrderDto): Promise<ApiResponse<Order>> {
        try {
            const totalSum = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const orderItems = order.orderItems.map(p => {
                return this.packageRepository.create({
                    orderItemId: crypto.randomUUID(),    
                    ...p
                });
            });
            const query = await this.orderRepository.create({
                orderType: order.orderType,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                totalAmount: totalSum,
                orderItems: orderItems
            }); 

            const res = await this.orderRepository.save(query);

            return {
                success: true,
                data: res
            }
        } catch (e) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.InternalServerError,
                    description: e
                }
            }
        }
    }
}