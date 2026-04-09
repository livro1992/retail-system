import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "@retail-system/shared";

@Entity()
export class User {
    @PrimaryGeneratedColumn({
        name: 'user_id'
    })
    userId: number;

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
}