import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { HttpModule } from "@nestjs/axios";
import { InventoryController } from "./inventory.controller";

@Module({
    imports: [
        ClientsModule.register([
            {
            name: 'INVENTORY_SERVICE',
            transport: Transport.RMQ,
            options: {
                urls: [process.env.AMQP_URL ?? 'amqp://localhost:5672'],
                queue: 'inventory_queue',
                queueOptions: { durable: true },
            },
            },
        ]),
        HttpModule,
    ],
    controllers: [InventoryController]
})
export class InventoryModule { }