import { MovementType } from '@retail-system/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stock_movements')
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    productId: string;

    @Column()
    marketId: string;

    @Column({ type: 'enum', enum: MovementType })
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