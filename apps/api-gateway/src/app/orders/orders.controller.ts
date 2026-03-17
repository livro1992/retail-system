import { Body, Controller, Get, HttpException, Inject, Post, UseGuards } from '@nestjs/common';
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
                this.httpService.post('http://localhost:3001/order', orderDto)
            );
            return data; 
        } catch (e) {
            console.error('Errore nella chiamata HTTP:', e.message);
            
            if (e.response) {
                // Logghiamo per noi sviluppatori nel terminale del Gateway
                console.error('--- ERRORE DAL MICROSERVIZIO ---');
                console.error('Status:', e.response.status);
                console.error('Body:', JSON.stringify(e.response.data, null, 2));

                // Rilanciamo l'errore al client (Frontend) ESATTAMENTE come ci è arrivato
                throw new HttpException(
                    e.response.data,      // Il messaggio di errore originale (es. l'array dei DTO falliti)
                    e.response.status     // Lo status code originale (400)
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
