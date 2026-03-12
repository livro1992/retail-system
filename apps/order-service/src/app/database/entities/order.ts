import { OrderStatus, OrderType } from "@retail-system/shared";
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
        name: 'status',
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.open
    })
    status: OrderStatus;

    @OneToMany(() => Package, (pack) => pack.packageId, {
        cascade: true,
    })
    packages: Package[];
}