import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto implements Readonly<CreateProductDto> {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  vat!: number;

  @Type(() => Number)
  @IsNumber()
  basePrice!: number;

  @IsString()
  @IsOptional()
  category?: string;
}
