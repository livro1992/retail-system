import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryCommand } from '@retail-system/shared';
import { Stock } from '../../database/entites/stock';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('shop-available')
  shopAvailable(
    @Query('marketId') marketId: string,
    @Query('shopStockContextKey') shopStockContextKey: string,
    @Query('warehouseIds') warehouseIdsCsv?: string,
  ) {
    if (marketId == null || marketId === '') {
      throw new BadRequestException('marketId query obbligatorio');
    }
    if (shopStockContextKey == null || shopStockContextKey === '') {
      throw new BadRequestException('shopStockContextKey query obbligatorio');
    }
    const warehouseIds =
      warehouseIdsCsv == null || warehouseIdsCsv === ''
        ? undefined
        : warehouseIdsCsv.split(',').map((s) => s.trim()).filter(Boolean);
    return this.stockService.findShopStockView({
      marketId,
      shopStockContextKey,
      warehouseIds,
    });
  }

  @Get()
  findAll() {
    return this.stockService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockService.findOne(id);
  }

  @Post()
  create(@Body() payload: Partial<Stock>) {
    return this.stockService.create(payload);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: Partial<Stock>) {
    return this.stockService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockService.remove(id);
  }

  @MessagePattern({ cmd: InventoryCommand.checkStatus })
  checkStatus() {
    return this.stockService.getStatus();
  }

  @MessagePattern({ cmd: InventoryCommand.checkAvailability })
  checkAvailability(
    @Payload()
    payload: {
      marketId: string;
      items: { productId: string; quantity: number; warehouseId?: string }[];
      shopStockContextKey?: string;
    },
  ) {
    return this.stockService.checkAvailability(
      payload.marketId,
      payload.items,
      payload.shopStockContextKey,
    );
  }

  @MessagePattern({ cmd: InventoryCommand.validateOrderProducts })
  validateOrderProducts(@Payload() payload: { productIds: string[] }) {
    return this.stockService.validateOrderProducts(payload.productIds);
  }

  @MessagePattern({ cmd: InventoryCommand.reserveStockForOrder })
  reserveStockForOrder(
    @Payload()
    payload: {
      marketId: string;
      orderId: string;
      items: { warehouseId: string; productId: string; quantity: number }[];
    },
  ) {
    return this.stockService.reserveStockForOrder(
      payload.marketId,
      payload.orderId,
      payload.items,
    );
  }

  @MessagePattern({ cmd: InventoryCommand.releaseStockForOrder })
  releaseStockForOrder(@Payload() payload: { orderId: string }) {
    return this.stockService.releaseStockForOrder(payload.orderId);
  }

  @MessagePattern({ cmd: InventoryCommand.deductInstantSale })
  deductInstantSale(
    @Payload()
    payload: {
      marketId: string;
      orderId: string;
      items: { warehouseId: string; productId: string; quantity: number }[];
    },
  ) {
    return this.stockService.deductInstantSale(
      payload.marketId,
      payload.orderId,
      payload.items,
    );
  }
}
