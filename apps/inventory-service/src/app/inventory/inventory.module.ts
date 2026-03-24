import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../database/entites/products';
import { Stock } from '../database/entites/stock';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Stock])],
  controllers: [
    ProductsController,
    StockController,
    StockMovementsController,
  ],
  providers: [ProductsService, StockService, StockMovementsService],
  exports: [ProductsService, StockService, StockMovementsService],
})
export class InventoryModule {}
