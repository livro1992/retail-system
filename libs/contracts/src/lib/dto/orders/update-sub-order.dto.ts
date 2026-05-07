import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateSubOrderDto } from './create-sub-order.dto';

/** Aggiornamento sub-ordine: stessi campi di creazione (`parentOrderId` resta immutabile lato service). */
export class UpdateSubOrderDto extends PartialType(CreateSubOrderDto) {
  @IsOptional()
  @IsUUID()
  fulfilledByUserId?: string | null;
}
