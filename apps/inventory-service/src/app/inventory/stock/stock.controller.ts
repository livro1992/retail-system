import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Stock } from '../../database/entites/stock';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

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

  @MessagePattern({ cmd: 'check_status' })
  checkStatus() {
    return this.stockService.getStatus();
  }

  @MessagePattern({ cmd: 'check_availability' })
  checkAvailability(
    @Payload()
    payload: {
      marketId: string;
      items: { productId: string; quantity: number }[];
    },
  ) {
    return this.stockService.checkAvailability(payload.marketId, payload.items);
  }
}
