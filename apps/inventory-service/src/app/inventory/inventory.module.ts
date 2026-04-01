import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../database/entites/products';
import { Stock } from '../database/entites/stock';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';
import { StockMovementsController } from './stock-movement/stock-movements.controller';
import { StockMovementsService } from './stock-movement/stock-movements.service';
import { StockMovement } from '../database/entites/sotck_movement';

@Module({
  imports: [TypeOrmModule.forFeature([
    Product, 
    Stock,
    StockMovement
  ])],
  controllers: [
    ProductsController,
    StockController,
    StockMovementsController,
  ],
  providers: [ProductsService, StockService, StockMovementsService],
  exports: [ProductsService, StockService, StockMovementsService],
})
export class InventoryModule {}
