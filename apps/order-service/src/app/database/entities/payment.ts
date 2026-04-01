import { PaymentDocumentType, PaymentMethod, PaymentStatus } from "@retail-system/shared";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Payment {
    @PrimaryGeneratedColumn('uuid', {
        name: 'payment_id'
    })
    paymentId: string;

    @CreateDateColumn({
        name: 'created_at'
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'update_at'
    })
    updateAt: Date;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2
    })
    amountTransaction: number;

    @Column({
        name: 'method',
        type: 'enum',
        enum: PaymentMethod,
    })
    method: PaymentMethod;

    @Column({
        name: 'document_type',
        type: 'enum',
        enum: PaymentDocumentType
    })
    documentType: PaymentDocumentType;


    @Column({
        name: 'status',
        type: 'enum',
        enum: PaymentStatus
    })
    status: PaymentStatus;

    @Column({
        nullable: true
    })
    transactionDetail: string;
}