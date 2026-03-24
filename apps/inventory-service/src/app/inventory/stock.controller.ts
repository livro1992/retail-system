import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll() {
    return this.stockService.findAll();
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
