import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Stock } from './stock';

@Entity('products')
export class Product {
  @PrimaryColumn()
  productId: string; // SKU o UUID (es: SKU-TRAP-01)

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 22 })
  vat: number;

  @Column()
  category: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Stock, (stock) => stock.product)
  stocks: Stock[];
}