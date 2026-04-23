import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentDocumentType } from '../../constants/orders/payment_document_type';
import { PaymentMethod } from '../../constants/orders/payment_method';
import { PaymentStatus } from '../../constants/orders/payment_status';

export class UpdatePaymentDto implements Readonly<UpdatePaymentDto> {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountTransaction?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentDocumentType)
  documentType?: PaymentDocumentType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionDetail?: string;
}
