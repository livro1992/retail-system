import { OrderFullfilmentMode, OrderPaymentStatus, OrderStatus, OrderType,  } from "@retail-system/shared";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderItem } from "./order_item";
import { Payment } from "./payment";
import { SubOrder } from "./sub_order";

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
        name: 'payment_status',
        type: 'enum',
        enum: OrderPaymentStatus,
        default: OrderPaymentStatus.pending
    })
    paymentStatus: OrderPaymentStatus;

    @Column({
        name: 'total_amount',
        type: 'decimal',
        precision: 12,
        scale: 2
    })
    totalAmount: number;

    @Column({
        name: 'market_id'
    })
    marketId: string;

    @Column({
        name: 'fulfillment_mode',
        type: 'enum',
        enum: OrderFullfilmentMode,
        default: OrderFullfilmentMode.instant
    })
    fulfillmentMode: OrderFullfilmentMode;

    @OneToMany(() => OrderItem, (item) => item.order, {
        cascade: true,
        onDelete: "CASCADE"
    })
    orderItems: OrderItem[];

    @OneToMany(() => SubOrder, (sub) => sub.parentOrder)
    subOrders: SubOrder[];

    @OneToOne(() => Payment, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'payment_id' })
    payment: Payment | null;
}