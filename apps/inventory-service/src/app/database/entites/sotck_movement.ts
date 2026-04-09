import { MovementType } from '@retail-system/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Product } from './products';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId', referencedColumnName: 'productId' })
  product: Product;

  @RelationId((m: StockMovement) => m.product)
  productId: string;

  @Column()
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
