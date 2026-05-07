import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './products';
import { Warehouse } from './warehouse';

@Entity('stock')
/** Unicità logica magazzino × prodotto: colonne FK `warehouse_id` + `productId`. */
@Unique('UQ_stock_warehouse_product', ['warehouse', 'product'])
@Index('IDX_stock_market_id', ['marketId'])
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  stockId: string;

  /**
   * Denormalizzato da `warehouse.marketId` in scrittura (`StockService`), allineato al magazzino
   * per filtri per market e compatibilità con query esistenti.
   */
  @Column({ name: 'market_id' })
  marketId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'warehouse_id', referencedColumnName: 'warehouseId' })
  warehouse: Warehouse;

  @RelationId((s: Stock) => s.warehouse)
  warehouseId: string;

  @Column({ default: 0 })
  physicalQuantity: number;

  @Column({ default: 0 })
  reservedQuantity: number;

  @UpdateDateColumn()
  lastUpdate: Date;

  @ManyToOne(() => Product, (product) => product.stocks, { 
    onDelete: 'CASCADE',
    nullable: false })
  @JoinColumn({ name: 'productId', referencedColumnName: 'productId' })
  product: Product;

  @RelationId((s: Stock) => s.product)
  productId: string;
}
