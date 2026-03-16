import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { OrdersController } from "./orders.controller";
import { HttpModule, HttpService } from "@nestjs/axios";

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'ORDERS_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'order_queue',
                    queueOptions: { durable: true },
                },
            },
        ]),
        HttpModule
    ],
    controllers: [OrdersController],
})
export class OrdersModule {}