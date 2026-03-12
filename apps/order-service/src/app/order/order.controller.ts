import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto, OrdersCommand } from '@retail-system/shared';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @MessagePattern({ cmd: OrdersCommand.createOrder })
    createOrder(@Payload() orderDto: CreateOrderDto) {
        console.log('ARRIVA QUALCOSA?');
        console.log(orderDto);

        return this.orderService.createOrder(orderDto);
    }
}
