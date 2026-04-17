import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreatePaymentDto, UpdatePaymentDto } from '@retail-system/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RolesAuthGuard } from '../auth/guards/roles-auth-guard';
import { rethrowDownstreamHttpError } from '../http/rethrow-downstream-http-error';
import { HTTP_DOWNSTREAM_TIMEOUT_MS } from '../rmq/send-with-timeout';
import { orderServiceBaseUrl } from './order-service-base-url';

const orderDownstreamError = {
  serviceUnavailableMessage:
    'Servizio Ordini momentaneamente non raggiungibile',
};

/** Proxy HTTP verso `order-service` (`/payment`). */
@Controller('payments')
export class PaymentsController {
  constructor(private readonly httpService: HttpService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async listPayments() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${orderServiceBaseUrl}/payment`, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, orderDownstreamError);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async getPayment(@Param('id') id: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${orderServiceBaseUrl}/payment/${id}`, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, orderDownstreamError);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async createPayment(@Body() dto: CreatePaymentDto) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${orderServiceBaseUrl}/payment`, dto, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, orderDownstreamError);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.put(`${orderServiceBaseUrl}/payment/${id}`, dto, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, orderDownstreamError);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async deletePayment(@Param('id') id: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete(`${orderServiceBaseUrl}/payment/${id}`, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, orderDownstreamError);
    }
  }
}
