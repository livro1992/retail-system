import { Controller, Get } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';

@Controller('stock-movements')
export class StockMovementsController {
  constructor(
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  @Get()
  findAll() {
    return this.stockMovementsService.findAll();
  }
}
