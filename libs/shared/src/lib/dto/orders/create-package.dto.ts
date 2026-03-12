import { IsDecimal, IsEnum, IsInt, IsOptional } from "class-validator";
import { PackageType } from "../../constants/orders/package_type";

export class CreatePackageDto implements Readonly<CreatePackageDto> {
    @IsEnum({
        enum: PackageType
    })
    packageType!: PackageType;

    @IsOptional()
    @IsDecimal()
    weight?: number;

    @IsInt()
    currentWarehouseId!: string;
}