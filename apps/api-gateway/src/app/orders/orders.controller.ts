import { Body, Controller, Get, HttpException, Inject, Post, UseGuards } from '@nestjs/common';
import { RolesAuthGuard } from '../auth/guards/roles-auth-guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto, OrdersCommand } from '@retail-system/shared';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HTTP_DOWNSTREAM_TIMEOUT_MS, sendRmqWithTimeout } from '../rmq/send-with-timeout';

@Controller('orders')
export class OrdersController {
    constructor(
         @Inject('ORDERS_SERVICE') private client: ClientProxy,
         private readonly httpService: HttpService
    ) {}

    @Get('status')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async getStatusOrderService() {
        // Asynchronous request/response via message broker (RMQ)
        return sendRmqWithTimeout(this.client, { cmd: OrdersCommand.checkStatus }, {});
    }

    
    @Post('create')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async createOrder(@Body() orderDto: CreateOrderDto) {
        try {
            // Synchronous call: API Gateway waits for HTTP response
            const { data } = await firstValueFrom(
                this.httpService.post('http://localhost:3001/order', orderDto, {
                    timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
                })
            );
            return data; 
        } catch (e) {
            if (e.response) {
                throw new HttpException(
                    e.response.data,
                    e.response.status
                );
            } 

            // 2. Caso: Il microservizio è spento o l'URL è sbagliato (Network Error)
            if (e.request) {
                console.error('Il microservizio sulla 3001 non risponde!');
                throw new HttpException('Servizio Ordini momentaneamente non raggiungibile', 503);
            }
            // 3. Caso: Errore imprevisto nel codice del Gateway
            throw new HttpException('Errore interno del Gateway', 500);
        }
    }
}
