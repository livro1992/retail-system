import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, RelationId } from "typeorm";
import { Order } from "./order";

@Entity()
export class OrderItem {
    /** Id riga ordine (stringa opaca; valorizzato in creazione ordine, non più uuid DB-generated). */
    @PrimaryColumn({ name: "order_item_id", type: "varchar", length: 128 })
    orderItemId: string;

    @Column({
        name: "product_id",
    })
    productId: string;

    @Column({
        name: "product_name",
    })
    productName: string;

    @Column({
        name: "quantity",
        type: "int",
        default: 1,
    })
    quantity: number;

    @Column({
        name: "price",
        type: "decimal",
        precision: 8,
        scale: 2,
    })
    price: number;

    @ManyToOne(() => Order, (order) => order.orderItems, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "order_id" })
    order: Order;

    @RelationId((item: OrderItem) => item.order)
    orderId: string;
}
