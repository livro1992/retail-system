import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { StockMovement } from '../../database/entites/sotck_movement';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockMovementsService.findOne(id);
  }

  @Post()
  create(@Body() payload: Partial<StockMovement>) {
    return this.stockMovementsService.create(payload);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: Partial<StockMovement>) {
    return this.stockMovementsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockMovementsService.remove(id);
  }
}
