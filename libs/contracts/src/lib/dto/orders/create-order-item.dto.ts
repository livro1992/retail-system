import { IsDecimal, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { PackageType } from "../../constants/orders/package_type";

export class CreateOrderItemDto implements Readonly<CreateOrderItemDto> {
    @IsString()
    productId!: string;

    /** Magazzino per check/reserve inventario (opzionale se usi `inventoryShopContextKey` sull ordine). */
    @IsOptional()
   //@IsUUID('4')
    warehouseId?: string;

    @IsString()
    productName!: string;

    @IsEnum(PackageType)
    packageType!: PackageType;

    @IsInt()
    quantity!: number;

    @IsNumber({
        maxDecimalPlaces: 2
    })
    @Min(0.01)
    price!: number;
}