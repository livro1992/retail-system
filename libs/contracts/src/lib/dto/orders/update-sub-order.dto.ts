import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { CreateSubOrderDto } from './create-sub-order.dto';

/** Aggiornamento sub-ordine: stessi campi di creazione (`parentOrderId` resta immutabile lato service). */
export class UpdateSubOrderDto extends PartialType(CreateSubOrderDto) {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fulfilledByUserId?: number | null;
}
