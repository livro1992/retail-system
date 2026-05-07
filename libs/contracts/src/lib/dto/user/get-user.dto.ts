import { IsEmail, IsEnum, IsOptional, IsUUID } from "class-validator";
import { UserRole } from "../../constants/user/user_roles";

export class GetUserDto implements Readonly<GetUserDto> {
    @IsUUID()
    userId!: string;

    @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
    email!: string;
    
    @IsEnum(UserRole)
    role!: UserRole;

    @IsOptional()
    @IsUUID()
    assignedWarehouseId?: string | null;
}