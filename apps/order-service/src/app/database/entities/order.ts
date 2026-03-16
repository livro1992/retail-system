import { OrderPaymentStatus, OrderStatus, OrderType } from "@retail-system/shared";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from "./order_item";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid', {
        name: 'order_id'
    })
    orderId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updateAt: Date;

    @Column({
        name: 'order_type',
        type: 'enum',
        enum: OrderType,
        default: OrderType.receipt
    })
    orderType: OrderType;

    @Column({
        name: 'order_status',
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.open
    })
    orderStatus: OrderStatus;

    @Column({
        name: 'payment_id',
        nullable: true
    })
    paymentId: string;

    @Column({
        name: 'payment_status',
        type: 'enum',
        enum: OrderPaymentStatus,
        default: OrderPaymentStatus.pending
    })
    paymentStatus: OrderPaymentStatus;

    @Column({
        name: 'total_amount',
        type: 'decimal',
        precision: 4,
        scale: 2
    })
    totalAmount: number;

    @Column()
    marketId: string;

    @OneToMany(() => OrderItem, (item) => item.orderItemId, {
        cascade: true,
    })
    orderItems: OrderItem[];
}