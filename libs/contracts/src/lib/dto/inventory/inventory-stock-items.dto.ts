import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/** Movimento inventario (check / reserve / deduct) sempre ancorato a magazzino + prodotto. */
export class InventoryStockLineDto {
  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ReserveStockForOrderPayloadDto {
  @IsString()
  @IsNotEmpty()
  marketId!: string;

  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryStockLineDto)
  items!: InventoryStockLineDto[];
}

export class DeductInstantSalePayloadDto {
  @IsString()
  @IsNotEmpty()
  marketId!: string;

  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryStockLineDto)
  items!: InventoryStockLineDto[];
}

/** Riga check: con `warehouseId` si verifica quel magazzino; senza, serve `shopStockContextKey` a livello payload. */
export class CheckAvailabilityItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class CheckAvailabilityPayloadDto {
  @IsString()
  @IsNotEmpty()
  marketId!: string;

  /**
   * Se ogni elemento ha `warehouseId`, controllo per magazzino.
   * Altrimenti ogni elemento è solo prodotto/qty e va passato `shopStockContextKey`.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckAvailabilityItemDto)
  items!: CheckAvailabilityItemDto[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  shopStockContextKey?: string;
}

/** Payload RMQ: verifica che il magazzino esista e sia nel market atteso (incrocio con ordine/suborder). */
export class ValidateWarehouseForMarketPayloadDto {
  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsString()
  @IsNotEmpty()
  marketId!: string;
}
