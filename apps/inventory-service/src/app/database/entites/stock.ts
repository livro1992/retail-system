import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Product } from "./products";

@Entity('stock')
export class Stock {
    @PrimaryGeneratedColumn('uuid')
    stockId: string;
    
    @Column()
    marketId: string;

    @Column({ default: 0 })
    physicalQuantity: number;

    @Column({ default: 0 })
    reservedQuantity: number;

    @UpdateDateColumn()
    lastUpdate: Date;

    @ManyToOne(() => Product, (product) => product.stocks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId', referencedColumnName: 'productId' })
    product: Product;

    @RelationId((s: Stock) => s.product)
    productId: string;
}