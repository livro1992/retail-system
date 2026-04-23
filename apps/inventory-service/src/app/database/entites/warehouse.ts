import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid', { name: 'warehouse_id' })
  warehouseId: string;

  @Column({ name: 'market_id' })
  marketId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
