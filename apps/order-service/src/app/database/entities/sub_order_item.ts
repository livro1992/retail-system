import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { SubOrder } from './sub_order';

@Entity('sub_order_items')
export class SubOrderItem {
  @PrimaryGeneratedColumn('uuid', { name: 'sub_order_item_id' })
  subOrderItemId: string;

  @ManyToOne(() => SubOrder, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sub_order_id' })
  subOrder: SubOrder;

  @RelationId((item: SubOrderItem) => item.subOrder)
  subOrderId: string;

  /** Allineato a {@link OrderItem.orderItemId} (varchar). */
  @Column({ name: 'order_item_id', type: 'varchar', length: 128 })
  orderItemId: string;

  @Column({ type: 'int' })
  quantity: number;
}
