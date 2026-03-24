import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn('uuid', {
        name: 'order_item_id'
    })
    orderItemId: string;
    
    @Column({
        name: 'product_id'
    })
    productId: string;

    @Column({
        name: 'product_name'
    })
    productName: string;

    @Column({
        name: 'quantity',
        type: 'int',
        default: 1
    })
    quantity: number;

    @Column({
        name: 'price',
        type: 'decimal',
        precision: 8,
        scale: 2
    })
    price: number;

    @ManyToOne(() => Order, (order) => order.orderItems, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({
        name: 'orderId',
    })
    order: Order;

    @Column()
    orderId: string;
}