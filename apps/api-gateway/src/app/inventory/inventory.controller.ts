import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import {
    CreateProductDto,
    CreateProductsBulkDto,
    INVENTORY_MUTATE_ROLES,
    INVENTORY_READ_ROLES,
    Roles,
} from '@retail-system/shared';
import { firstValueFrom } from 'rxjs';
import { rethrowDownstreamHttpError } from '../http/rethrow-downstream-http-error';
import { HTTP_DOWNSTREAM_TIMEOUT_MS, sendRmqWithTimeout } from '../rmq/send-with-timeout';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RolesAuthGuard } from '../auth/guards/roles-auth-guard';

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
  /**
   * Stock per magazzini collegati al contesto negozio (`store_warehouse_access` lato inventory).
   */
  @Get('stock/shop-available')
  @Roles(...INVENTORY_READ_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async shopAvailableStock(
    @Query('marketId') marketId: string,
    @Query('shopStockContextKey') shopStockContextKey: string,
    @Query('warehouseIds') warehouseIds?: string,
  ) {
    if (marketId == null || marketId === '') {
      throw new BadRequestException('Query marketId obbligatoria');
    }
    if (shopStockContextKey == null || shopStockContextKey === '') {
      throw new BadRequestException('Query shopStockContextKey obbligatoria');
    }
    const params = new URLSearchParams({ marketId, shopStockContextKey });
    if (warehouseIds != null && warehouseIds !== '') {
      params.set('warehouseIds', warehouseIds);
    }
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${inventoryHttpBase}/stock/shop-available?${params.toString()}`,
          { timeout: HTTP_DOWNSTREAM_TIMEOUT_MS },
        ),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Get('products')
  @Roles(...INVENTORY_READ_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
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

  @Post('products/bulk')
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async createProductsBulk(@Body() dto: CreateProductsBulkDto) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${inventoryHttpBase}/products/bulk`, dto, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Post('products')
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
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
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
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

  @Get('warehouses')
  @Roles(...INVENTORY_READ_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async listWarehouses(@Query('marketId') marketId?: string) {
    const params = new URLSearchParams();
    
    if (marketId != null && marketId !== '') {
      params.set('marketId', marketId);
    }
    const url = `${inventoryHttpBase}/warehouses${params.toString() ? `?${params.toString()}` : ''}`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, { timeout: HTTP_DOWNSTREAM_TIMEOUT_MS }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Get('warehouses/:warehouseId')
  @Roles(...INVENTORY_READ_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async getWarehouse(@Param('warehouseId') warehouseId: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${inventoryHttpBase}/warehouses/${warehouseId}`, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Post('warehouses')
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async createWarehouse(@Body() payload: { marketId: string; name?: string | null }) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${inventoryHttpBase}/warehouses`, payload, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Put('warehouses/:warehouseId')
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async updateWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Body() payload: { marketId?: string; name?: string | null },
  ) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.put(`${inventoryHttpBase}/warehouses/${warehouseId}`, payload, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Delete('warehouses/:warehouseId')
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async removeWarehouse(@Param('warehouseId') warehouseId: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete(`${inventoryHttpBase}/warehouses/${warehouseId}`, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Get('store-warehouse-access/:marketId/:storeContextKey')
  @Roles(...INVENTORY_READ_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async listStoreWarehouseAccess(
    @Param('marketId') marketId: string,
    @Param('storeContextKey') storeContextKey: string,
  ) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${inventoryHttpBase}/store-warehouse-access/${marketId}/${storeContextKey}`,
          { timeout: HTTP_DOWNSTREAM_TIMEOUT_MS },
        ),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Post('store-warehouse-access')
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async addStoreWarehouseAccess(
    @Body() payload: { marketId: string; storeContextKey: string; warehouseId: string },
  ) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${inventoryHttpBase}/store-warehouse-access`, payload, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }

  @Delete('store-warehouse-access/:id')
  @Roles(...INVENTORY_MUTATE_ROLES)
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  async removeStoreWarehouseAccess(@Param('id') id: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete(`${inventoryHttpBase}/store-warehouse-access/${id}`, {
          timeout: HTTP_DOWNSTREAM_TIMEOUT_MS,
        }),
      );
      return data;
    } catch (e) {
      rethrowDownstreamHttpError(e, inventoryDownstreamError);
    }
  }
}
