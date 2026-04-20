import { HttpService } from "@nestjs/axios";
import { Body, Controller, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Request } from "express";
import { RolesAuthGuard } from "../auth/guards/roles-auth-guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth-guard";
import { CreateSubOrderDto, UpdateSubOrderDto } from "@retail-system/contracts";
import { JwtPayload, Roles, SUBORDER_CREATE_ROLES, SUBORDER_UPDATE_ROLES } from "@retail-system/shared";
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
    @Roles(...SUBORDER_CREATE_ROLES)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async createSubOrder(@Body() suborderDto: CreateSubOrderDto, @Req() req: Request) {
        try {
            const user = req["user"] as JwtPayload;
            // Synchronous call: API Gateway waits for HTTP response
            const { data } = await firstValueFrom(
                this.httpService.post(`${orderServiceBaseUrl}/order/suborder`, suborderDto, {
                    timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
                    headers: user ? { "x-user-id": String(user.id) } : undefined,
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
    @Roles(...SUBORDER_UPDATE_ROLES)
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