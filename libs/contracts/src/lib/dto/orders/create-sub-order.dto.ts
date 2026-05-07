import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PhysicalSubOrderStatus } from '../../constants/orders/physical_sub_order_status';
import { CreateSubOrderItemDto } from './create-sub-order-item.dto';

export class CreateSubOrderDto implements Readonly<CreateSubOrderDto> {
  @IsOptional()
  @IsString()
  parentOrderId?: string;

  @IsOptional()
  @IsEnum(PhysicalSubOrderStatus)
  physicalStatus?: PhysicalSubOrderStatus;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  /** Obbligatorio se il suborder ha righe (`items`). */
  @ValidateIf((o) => (o.items?.length ?? 0) > 0)
  @IsNotEmpty({ message: 'warehouseId è obbligatorio quando il suborder ha righe' })
  @IsUUID()
  warehouseId?: string;

  /** Opzionale: suborder anche senza righe (es. bozza o solo metadati). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubOrderItemDto)
  items?: CreateSubOrderItemDto[];
}
