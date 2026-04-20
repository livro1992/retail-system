import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
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

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubOrderItemDto)
  items?: CreateSubOrderItemDto[];
}
