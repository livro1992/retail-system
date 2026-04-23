import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RolesAuthGuard } from '../auth/guards/roles-auth-guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { ClientProxy } from '@nestjs/microservices';
import {
    ALL_APP_ROLES,
    CreateOrderDto,
    CreateSubOrderDto,
    JwtPayload,
    ORDER_WRITE_ROLES,
    OrdersCommand,
    Roles,
    SUBORDER_MATERIALIZE_ROLES,
} from '@retail-system/shared';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { rethrowDownstreamHttpError } from '../http/rethrow-downstream-http-error';
import { HTTP_DOWNSTREAM_TIMEOUT_MS, sendRmqWithTimeout } from '../rmq/send-with-timeout';
import { orderServiceBaseUrl } from './order-service-base-url';

@Controller('orders')
export class OrdersController {
    constructor(
        @Inject('ORDERS_SERVICE') private client: ClientProxy,
        private readonly httpService: HttpService
    ) {}

    @Get('status')
    @Roles(...ALL_APP_ROLES)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async getStatusOrderService() {
        return sendRmqWithTimeout(this.client, { cmd: OrdersCommand.checkStatus }, {});
    }

    
    @Post('create')
    @Roles(...ORDER_WRITE_ROLES)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async createOrder(@Body() orderDto: CreateOrderDto, @Req() req: Request) {
        try {
            const user = req['user'] as JwtPayload;
            // Synchronous call: API Gateway waits for HTTP response
            const { data } = await firstValueFrom(
                this.httpService.post(`${orderServiceBaseUrl}/order`, orderDto, {
                    timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
                    headers: user ? { 'x-user-id': String(user.id) } : undefined,
                })
            );
            return data;
        } catch (e) {
            rethrowDownstreamHttpError(e, {
                serviceUnavailableMessage:
                    'Servizio Ordini momentaneamente non raggiungibile',
            });
        }
    }

    @Put('update/:id')
    @Roles(...ORDER_WRITE_ROLES)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async updateOrder(
        @Param('id') id: string,
        @Body() orderDto: Partial<CreateOrderDto>,
    ) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.put(
                    `${orderServiceBaseUrl}/order/${id}`,
                    orderDto,
                    { timeout: HTTP_DOWNSTREAM_TIMEOUT_MS },
                ),
            );
            return data;
        } catch (e) {
            rethrowDownstreamHttpError(e, {
                serviceUnavailableMessage:
                    'Servizio Ordini momentaneamente non raggiungibile',
            });
        }
    }

    @Post('order/:orderId/suborder/:subOrderId/materialize')
    @Roles(...SUBORDER_MATERIALIZE_ROLES)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async materializeSubOrderToOrderItems(
        @Param('orderId') orderId: string,
        @Param('subOrderId') subOrderId: string,
    ) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${orderServiceBaseUrl}/order/${orderId}/suborder/${subOrderId}/materialize`,
                    {},
                    { timeout: HTTP_DOWNSTREAM_TIMEOUT_MS },
                ),
            );
            return data;
        } catch (e) {
            rethrowDownstreamHttpError(e, {
                serviceUnavailableMessage:
                    'Servizio Ordini momentaneamente non raggiungibile',
            });
        }
    }
}
