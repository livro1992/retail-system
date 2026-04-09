import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSubOrderDto } from './create-sub-order.dto';

/** Aggiornamento sub-ordine: stessi campi di creazione tranne `parentOrderId` (immutabile). */
export class UpdateSubOrderDto extends PartialType(CreateSubOrderDto) {}
