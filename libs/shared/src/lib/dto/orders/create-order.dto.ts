import { IsArray, IsEnum, IsOptional, ValidateNested } from "class-validator";
import { OrderType } from "../../constants/orders/order_type";
import { OrderStatus } from "../../constants/orders/order_status";
import { OrderPaymentStatus } from "../../constants/orders/order_payment_status";
import { CreatePackageDto } from "./create-package.dto";
import { Type } from 'class-transformer';

export class CreateOrderDto implements Readonly<CreateOrderDto> {
      @IsOptional()
      @IsEnum(OrderType)
      orderType?: OrderType;

      @IsOptional()
      @IsEnum(OrderStatus)
      orderStatus?: OrderStatus;

      @IsOptional()
      @IsEnum(OrderPaymentStatus)
      paymentStatus?: OrderPaymentStatus;

      @IsArray({
        always: true,
        message: 'Invalid order. Insert al least one article'
      })
      @Type(() => CreatePackageDto)
      packages!: CreatePackageDto[];
}