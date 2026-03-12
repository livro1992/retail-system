import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "../database/entities/order";
import { Package } from "../database/entities/package";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            Package
        ])
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService]
})
export class OrderModule {}