import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { CreateProductDto } from '@retail-system/shared';
import { firstValueFrom } from 'rxjs';
import { rethrowDownstreamHttpError } from '../http/rethrow-downstream-http-error';
import { HTTP_DOWNSTREAM_TIMEOUT_MS, sendRmqWithTimeout } from '../rmq/send-with-timeout';

const inventoryHttpBase =
  process.env.INVENTORY_SERVICE_URL ?? 'http://localhost:3002';

const inventoryDownstreamError = {
  serviceUnavailableMessage:
    'Servizio inventario momentaneamente non raggiungibile',
};

@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject('INVENTORY_SERVICE') private client: ClientProxy,
    private readonly httpService: HttpService,
  ) {}

  @Get('health')
  health(): { message: string } {
    return { message: 'L\'Inventario è attivo' };
  }

  @Get('status')
  async checkInventoryStatus() {
    return sendRmqWithTimeout(this.client, { cmd: 'check_status' }, {});
  }

  /** Lista prodotti (GET). Il browser fa solo GET: senza questa rotta, /inventory/products dava 404. */
  @Get('products')
  async listProducts() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${inventoryHttpBase}/products`, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Post('products')
  // Abilita per ambienti protetti: @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async createProduct(@Body() dto: CreateProductDto) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${inventoryHttpBase}/products`, dto, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Put('products/:id')
  // @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.put(`${inventoryHttpBase}/products/${id}`, dto, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }
}
