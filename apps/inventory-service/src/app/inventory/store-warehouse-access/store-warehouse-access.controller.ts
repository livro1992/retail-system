import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { StoreWarehouseAccessService } from './store-warehouse-access.service';

@Controller('store-warehouse-access')
export class StoreWarehouseAccessController {
  constructor(private readonly accessService: StoreWarehouseAccessService) {}

  @Get(':marketId/:storeContextKey')
  list(@Param('marketId') marketId: string, @Param('storeContextKey') storeContextKey: string) {
    return this.accessService.listByMarketAndContext(marketId, storeContextKey);
  }

  @Post()
  add(
    @Body()
    body: { marketId: string; storeContextKey: string; warehouseId: string },
  ) {
    return this.accessService.addAccess(body.marketId, body.storeContextKey, body.warehouseId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessService.removeAccess(id);
  }
}
