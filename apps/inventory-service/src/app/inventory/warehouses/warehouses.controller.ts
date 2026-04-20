import {
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
import { Warehouse } from '../../database/entites/warehouse';
import { WarehousesService } from './warehouses.service';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  list(@Query('marketId') marketId?: string): Promise<Warehouse[]> {
    if (marketId != null && marketId !== '') {
      return this.warehousesService.findByMarketId(marketId);
    }
    return this.warehousesService.findAll();
  }

  @Get(':warehouseId')
  findOne(@Param('warehouseId') warehouseId: string): Promise<Warehouse> {
    return this.warehousesService.findOne(warehouseId);
  }

  @Post()
  create(
    @Body() payload: { marketId: string; name?: string | null },
  ): Promise<Warehouse> {
    return this.warehousesService.create(payload);
  }

  @Put(':warehouseId')
  update(
    @Param('warehouseId') warehouseId: string,
    @Body() payload: Partial<Pick<Warehouse, 'marketId' | 'name'>>,
  ): Promise<Warehouse> {
    return this.warehousesService.update(warehouseId, payload);
  }

  @Delete(':warehouseId')
  remove(@Param('warehouseId') warehouseId: string): Promise<{ message: string }> {
    return this.warehousesService.remove(warehouseId);
  }

  @MessagePattern({ cmd: InventoryCommand.validateWarehouseForMarket })
  validateWarehouseForMarket(
    @Payload() payload: { warehouseId: string; marketId: string },
  ): Promise<void> {
    return this.warehousesService.assertWarehouseBelongsToMarket(
      payload.warehouseId,
      payload.marketId,
    );
  }
}
