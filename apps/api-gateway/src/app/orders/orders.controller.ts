import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { RolesAuthGuard } from '../auth/guards/roles-auth-guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto, OrdersCommand } from '@retail-system/shared';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('orders')
export class OrdersController {
    constructor(
         @Inject('ORDERS_SERVICE') private client: ClientProxy,
         private readonly httpService: HttpService
    ) {}

    @Get('status')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    getStatusOrderService() {
        return this.client.send({ cmd: OrdersCommand.checkStatus }, {});
    }

    
    @Post('create')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async createOrder(@Body() orderDto: CreateOrderDto) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.post('http://localhost:3001/orders/create', orderDto)
            );
            return data; 
        } catch (e) {
            console.error('Errore nella chiamata HTTP:', e.message);
            
            if (e.response) {
                console.error('Dati errore server:', e.response.data);
                return {
                    success: false,
                    message: 'Errore dal microservizio',
                    detail: e.response.data
                };
            }
            return { success: false, message: e.message };
        }
    }
}
