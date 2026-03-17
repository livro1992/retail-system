import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "../database/entities/order";
import { OrderItem } from "../database/entities/order_item";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem
        ])
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService]
})
export class OrderModule {}