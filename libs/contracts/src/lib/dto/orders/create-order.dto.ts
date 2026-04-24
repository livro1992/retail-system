import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { OrderType } from "../../constants/orders/order_type";
import { OrderStatus } from "../../constants/orders/order_status";
import { OrderPaymentStatus } from "../../constants/orders/order_payment_status";
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from "./create-order-item.dto";
import { CreateSubOrderDto } from "./create-sub-order.dto";
import { OrderFullfilmentMode } from "../../constants/orders/order_fullfilmode";

export class CreateOrderDto implements Readonly<CreateOrderDto> {
      @IsEnum(OrderType)
      orderType!: OrderType;

      @IsOptional()
      @IsEnum(OrderStatus)
      orderStatus?: OrderStatus;

      @IsOptional()
      @IsEnum(OrderPaymentStatus)
      paymentStatus?: OrderPaymentStatus;

      /** Obbligatorio quando `paymentStatus` è `paid` (Payment già creato nel sistema). */
      @ValidateIf((o) => o.paymentStatus === OrderPaymentStatus.paid)
      @IsNotEmpty({ message: 'payment_id è obbligatorio quando payment_status è paid' })
      @IsString()
      paymentId?: string;

      @IsString()
      marketId!: string;

      /**
       * Contesto negozio per disponibilità aggregata sui magazzini collegati (`store_warehouse_access`).
       * Usato quando le righe ordine non portano `warehouseId`.
       */
      @IsOptional()
      @IsString()
      inventoryShopContextKey?: string;

      @IsEnum(OrderFullfilmentMode)
      fulfillmentMode!: OrderFullfilmentMode;

      @IsOptional()
      @IsArray()
      @ValidateNested({ each: true })
      @Type(() => CreateOrderItemDto)
      orderItems?: CreateOrderItemDto[];

      @IsOptional()
      @IsArray()
      @ValidateNested({ each: true })
      @Type(() => CreateSubOrderDto)
      subOrders?: CreateSubOrderDto[];
}