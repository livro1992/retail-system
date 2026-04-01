import { IsDecimal, IsEnum, IsInt, IsNumber, IsString, Min } from "class-validator";
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

    @IsNumber({
        maxDecimalPlaces: 2
    })
    @Min(0.01)
    price!: number;
}