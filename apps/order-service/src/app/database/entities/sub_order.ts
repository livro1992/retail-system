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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;


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
    type: 'varchar',
    length: 64,
    default: PhysicalSubOrderStatus.PENDING,
  })
  physicalStatus: PhysicalSubOrderStatus;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  /** Allineato a `User.userId` nel auth-service; valorizzato dal backend (es. da JWT), non dal client. */
  @Column({ name: 'created_by_user_id', type: 'int', nullable: true })
  createdByUserId: number | null;

  @Column({ name: 'fulfilled_by_user_id', type: 'int', nullable: true })
  fulfilledByUserId: number | null;

  /** Riferimento opaco al magazzino nell’inventory-service (nessuna FK cross-DB). */
  @Column({ name: 'warehouse_id', type: 'uuid', nullable: true })
  warehouseId: string | null;

  @OneToMany(() => SubOrderItem, (row) => row.subOrder, { cascade: ['insert', 'update'] })
  items: SubOrderItem[];
}
