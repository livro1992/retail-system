import { IsInt, IsString, Min } from 'class-validator';

export class CreateSubOrderItemDto implements Readonly<CreateSubOrderItemDto> {
  @IsString()
  orderItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
