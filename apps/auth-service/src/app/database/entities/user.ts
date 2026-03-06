import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "@retail-system/shared";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    userId: number;

    @Column({
        unique: true
    })
    email: string;

    @Column({
        select: false
    })
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.admin
    })
    role: UserRole;
}