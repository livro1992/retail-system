import { OrderPaymentStatus, OrderStatus, OrderType } from "@retail-system/shared";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Package } from "./package";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid', {
        name: 'order_id'
    })
    orderId: string;

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

    @OneToMany(() => Package, (pack) => pack.packageId, {
        cascade: true,
    })
    packages: Package[];
}