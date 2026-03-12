import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { RolesAuthGuard } from '../auth/guards/roles-auth-guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto, OrdersCommand } from '@retail-system/shared';

@Controller('orders')
export class OrdersController {
    constructor(
         @Inject('ORDERS_SERVICE') private client: ClientProxy
    ) {}

    @Get('status')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    getStatusOrderService() {
        return this.client.send({ cmd: OrdersCommand.checkStatus }, {});
    }

    
    @Post('create')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    createOrder(@Body() orderDto: CreateOrderDto) {
        console.log(orderDto);
        return this.client.send({ cmd: OrdersCommand.createOrder }, orderDto);
    }
}
