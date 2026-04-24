import {
  Column,
  Entity,
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
@Unique('UQ_stock_warehouse_product', ['warehouseId', 'productId'])
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  stockId: string;

  /** Denormalizzato da `warehouse.marketId` in scrittura, per filtri e compatibilità. */
  @Column()
  marketId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
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

  @ManyToOne(() => Product, (product) => product.stocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId', referencedColumnName: 'productId' })
  product: Product;

  @RelationId((s: Stock) => s.product)
  productId: string;
}
