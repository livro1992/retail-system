import { PhysicalSubOrderStatus } from '@retail-system/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order';
import { SubOrderItem } from './sub_order_item';

@Entity('sub_orders')
export class SubOrder {
  @PrimaryGeneratedColumn('uuid', { name: 'sub_order_id' })
  subOrderId: string;

  @Column({ name: 'parent_order_id', type: 'uuid', nullable: true })
  parentOrderId: string | null;

  @ManyToOne(() => Order, (order) => order.subOrders, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_order_id' })
  parentOrder: Order | null;

  @Column({
    name: 'physical_status',
    type: 'enum',
    enum: PhysicalSubOrderStatus,
    default: PhysicalSubOrderStatus.PENDING,
  })
  physicalStatus: PhysicalSubOrderStatus;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SubOrderItem, (row) => row.subOrder, { cascade: ['insert', 'update'] })
  items: SubOrderItem[];
}
