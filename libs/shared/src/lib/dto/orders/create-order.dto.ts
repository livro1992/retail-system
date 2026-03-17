import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { OrderType } from "../../constants/orders/order_type";
import { OrderStatus } from "../../constants/orders/order_status";
import { OrderPaymentStatus } from "../../constants/orders/order_payment_status";
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from "./create-order-item.dto";
import { OrderFullfilmentMode } from "../../constants/orders/order_fullfilmode";

export class CreateOrderDto implements Readonly<CreateOrderDto> {
      @IsOptional()
      @IsEnum(OrderType)
      orderType?: OrderType;

      @IsOptional()
      @IsEnum(OrderStatus)
      orderStatus?: OrderStatus;

      @IsOptional()
      @IsString()
      paymentId?: string;

      @IsOptional()
      @IsEnum(OrderPaymentStatus)
      paymentStatus?: OrderPaymentStatus;

      @IsString()
      marketId!: string;

      @IsEnum(OrderFullfilmentMode)
      fulfillmentMode!: OrderFullfilmentMode;

      @IsArray({
        always: true,
        message: 'Invalid order. Insert al least one article'
      })
      @Type(() => CreateOrderItemDto)
      orderItems!: CreateOrderItemDto[];
}