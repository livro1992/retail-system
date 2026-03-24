import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateOrderDto } from '@retail-system/shared';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    createOrder(@Body() orderDto: CreateOrderDto) {
        return this.orderService.createOrder(orderDto);
    }

    @Get()
    getAllOrders() {
        return this.orderService.getAllOrders();
    }

    @Get(':id')
    getOrderById(@Param('id') id: string) {
        return this.orderService.getOrderById(id);
    }

    @Put(':id')
    updateOrder(@Param('id') id: string, @Body() orderDto: Partial<CreateOrderDto>) {
        return this.orderService.updateOrder(id, orderDto);
    }

    @Delete(':id')
    deleteOrder(@Param('id') id: string) {
        return this.orderService.deleteOrder(id);
    }
}
