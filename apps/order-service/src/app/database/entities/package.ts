import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order";
import { PackageStatus, PackageType } from "@retail-system/shared";

@Entity()
export class Package {
    @PrimaryGeneratedColumn({
        name: 'package_id'
    })
    packageId: number;

    @Column({
        unique: true
    })
    trackingCode: string;

    @Column({ 
        type: 'enum',
        enum: PackageType,
        name: 'package_type', 
        default: PackageType.pallet
    })
    packageType: PackageType;

    @Column({ 
        type: 'decimal', 
        nullable: true 
    })
    weight: number;


    @Column({
        name: 'status',
        type: 'enum',
        enum: PackageStatus,
        default: PackageStatus.inStock
    })
    status: PackageStatus;

    @ManyToOne(() => Order, (order) => order.orderId)
    @JoinColumn({
        name: 'order'
    })
    order: Order;

    @Column({ 
        name: 'current_warehouse_id' 
    })
    currentWarehouseId: string;
}