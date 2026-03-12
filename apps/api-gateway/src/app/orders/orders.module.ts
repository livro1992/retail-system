import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { OrdersController } from "./orders.controller";

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
    ],
    controllers: [OrdersController]
})
export class OrdersModule {}