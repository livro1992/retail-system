import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentDocumentType } from '../../constants/orders/payment_document_type';
import { PaymentMethod } from '../../constants/orders/payment_method';
import { PaymentStatus } from '../../constants/orders/payment_status';

export class CreatePaymentDto implements Readonly<CreatePaymentDto> {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountTransaction!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsEnum(PaymentDocumentType)
  documentType!: PaymentDocumentType;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionDetail?: string;
}
