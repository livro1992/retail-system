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
import { Warehouse } from '../database/entites/warehouse';
import { WarehousesController } from './warehouses/warehouses.controller';
import { WarehousesService } from './warehouses/warehouses.service';
import { StoreWarehouseAccess } from '../database/entites/store_warehouse_access';
import { StoreWarehouseAccessService } from './store-warehouse-access/store-warehouse-access.service';
import { StoreWarehouseAccessController } from './store-warehouse-access/store-warehouse-access.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Product,
    Stock,
    StockMovement,
    Warehouse,
    StoreWarehouseAccess,
  ])],
  controllers: [
    ProductsController,
    StockController,
    StockMovementsController,
    WarehousesController,
    StoreWarehouseAccessController,
  ],
  providers: [
    ProductsService,
    StockService,
    StockMovementsService,
    WarehousesService,
    StoreWarehouseAccessService,
  ],
  exports: [
    ProductsService,
    StockService,
    StockMovementsService,
    WarehousesService,
    StoreWarehouseAccessService,
  ],
})
export class InventoryModule {}
