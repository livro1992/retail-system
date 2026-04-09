import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItem } from './order_item';
import { SubOrder } from './sub_order';

@Entity('sub_order_items')
export class SubOrderItem {
  @PrimaryGeneratedColumn('uuid', { name: 'sub_order_item_id' })
  subOrderItemId: string;

  @Column({ name: 'sub_order_id' })
  subOrderId: string;

  @ManyToOne(() => SubOrder, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sub_order_id' })
  subOrder: SubOrder;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @Column({ type: 'int' })
  quantity: number;
}
