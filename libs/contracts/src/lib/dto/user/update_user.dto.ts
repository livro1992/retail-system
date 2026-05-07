import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../constants/user/user_roles';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(8, { message: 'La password deve essere di almeno 8 caratteri' })
    password?: string;
    
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsUUID()
    assignedWarehouseId?: string | null;
}