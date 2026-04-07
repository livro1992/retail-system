import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "../database/entities/order";
import { OrderItem } from "../database/entities/order_item";
import { SubOrder } from "../database/entities/sub_order";
import { SubOrderItem } from "../database/entities/sub_order_item";
import { Payment } from "../database/entities/payment";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            Payment,
            SubOrder,
            SubOrderItem,
        ]),
        ClientsModule.register([
            {
                name: 'INVENTORY_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'inventory_queue',
                    queueOptions: { durable: true },
                },
            },
        ])
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService]
})
export class OrderModule {}