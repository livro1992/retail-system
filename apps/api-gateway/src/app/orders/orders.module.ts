import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { OrdersController } from "./orders.controller";
import { HttpModule, HttpService } from "@nestjs/axios";
import { SubordersController } from "./suborders.controller";
import { PaymentsController } from "./payments.controller";

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'ORDERS_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.AMQP_URL ?? 'amqp://localhost:5672'],
                    queue: 'order_queue',
                    queueOptions: { durable: true },
                },
            },
        ]),
        HttpModule
    ],
    controllers: [OrdersController, SubordersController, PaymentsController],
})
export class OrdersModule {}