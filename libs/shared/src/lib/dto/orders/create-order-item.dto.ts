import { IsDecimal, IsEnum, IsInt, IsString } from "class-validator";
import { PackageType } from "../../constants/orders/package_type";

export class CreateOrderItemDto implements Readonly<CreateOrderItemDto> {
    @IsString()
    productId!: string;

    @IsString()
    productName!: string;

    @IsEnum(PackageType)
    packageType!: PackageType;

    @IsInt()
    quantity!: number;

    @IsDecimal()
    price!: number;
}