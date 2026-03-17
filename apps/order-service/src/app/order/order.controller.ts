import { Controller, Post } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { CreateOrderDto } from '@retail-system/shared';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}
/*
    @MessagePattern({ cmd: OrdersCommand.createOrder })
    createOrder(@Payload() orderDto: CreateOrderDto) {
        return this.orderService.createOrder(orderDto);
    }*/

    @Post()
    createOrder(@Payload() orderDto: CreateOrderDto) {
        return this.orderService.createOrder(orderDto);
    }
}
