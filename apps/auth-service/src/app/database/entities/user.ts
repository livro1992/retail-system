import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "@retail-system/shared";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid', {
        name: 'user_id'
    })
    userId: string;

    @Column({
        unique: true,
        name: 'email'
    })
    email: string;

    @Column({
        select: false,
        name: 'password'
    })
    password: string;

    @Column({
        type: 'varchar',
        length: 64,
        default: UserRole.admin,
        name: 'user_role'
    })
    role: UserRole;

    /** Magazzino di competenza per operatori warehouse (opaco verso inventory-service). */
    @Column({ name: 'assigned_warehouse_id', type: 'uuid', nullable: true })
    assignedWarehouseId: string | null;
}