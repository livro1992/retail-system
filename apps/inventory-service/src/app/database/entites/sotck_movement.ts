import { MovementType } from '@retail-system/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Product } from './products';
import { Warehouse } from './warehouse';

@Entity('stock_movements')
@Index('IDX_stock_movements_order_type', ['orderId', 'type'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'productId', referencedColumnName: 'productId' })
  product: Product;

  @RelationId((m: StockMovement) => m.product)
  productId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id', referencedColumnName: 'warehouseId' })
  warehouse: Warehouse;

  @RelationId((m: StockMovement) => m.warehouse)
  warehouseId: string;

  /**
   * Deve coincidere con `warehouse.marketId`; valorizzato in `StockService` insieme al magazzino.
   */
  @Column({ name: 'market_id' })
  marketId: string;

  @Column({ type: 'varchar', length: 64 })
  type: MovementType;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
