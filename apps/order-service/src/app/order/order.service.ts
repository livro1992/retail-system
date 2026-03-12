import { Injectable } from "@nestjs/common";
import { ApiResponse, CreateOrderDto, OrderPaymentStatus, OrderStatus, OrderType, PackageStatus } from "@retail-system/shared";
import { Order } from "../database/entities/order";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Package } from "../database/entities/package";
import { HttpStatusCode } from "axios";
import { log } from "node:console";

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(Package) private packageRepository: Repository<Package>
    ) {}

    async createOrder(order: CreateOrderDto): Promise<ApiResponse<Order>> {
        try {
            const packages = order.packages.map(p => {
                return this.packageRepository.create({
                    ...p,
                    trackingCode: crypto.randomUUID(),
                    status: PackageStatus.inStock
                });
            });
            const query = await this.orderRepository.create({
                orderType: OrderType.receipt,
                orderStatus: OrderStatus.open,
                paymentStatus: OrderPaymentStatus.pending,
                totalAmount: this.calcAmount(),
                packages: packages
            });
            const orderDb = await this.orderRepository.save(query);

            return {
                success: true,
                data: orderDb
            }
        } catch (e) {
            console.log(e);
            
            return {
                success: false,
                error: {
                    code: HttpStatusCode.InternalServerError,
                    description: e
                }
            }
        }
    }

    private calcAmount(): number {
        return 10;
    }
}