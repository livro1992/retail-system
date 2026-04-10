import { HttpService } from "@nestjs/axios";
import { Body, Controller, Inject, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { RolesAuthGuard } from "../auth/guards/roles-auth-guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth-guard";
import { CreateSubOrderDto, UpdateSubOrderDto } from "@retail-system/contracts";
import { firstValueFrom } from "rxjs";
import { HTTP_DOWNSTREAM_TIMEOUT_MS } from "../rmq/send-with-timeout";
import { rethrowDownstreamHttpError } from "../http/rethrow-downstream-http-error";
import { orderServiceBaseUrl } from "./order-service-base-url";

@Controller('suborders')
export class SubordersController {
    constructor(
        @Inject('ORDERS_SERVICE') private client: ClientProxy,
        private readonly httpService: HttpService
    ) {}

    @Post('create')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async createSubOrder(@Body() suborderDto: CreateSubOrderDto) {
        try {
            // Synchronous call: API Gateway waits for HTTP response
            const { data } = await firstValueFrom(
                this.httpService.post(`${orderServiceBaseUrl}/order/suborder`, suborderDto, {
                    timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
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

    @Put('update/:subOrderId')
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async updateSubOrder(
        @Param('subOrderId') subOrderId: string,
        @Body() dto: UpdateSubOrderDto,
    ) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.put(
                    `${orderServiceBaseUrl}/order/suborder/${subOrderId}`,
                    dto,
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