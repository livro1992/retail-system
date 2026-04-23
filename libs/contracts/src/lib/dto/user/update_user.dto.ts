import { PartialType } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../constants/user/user_roles';

export class UpdateUserDto {
    @IsString()
    @MinLength(8, { message: 'La password deve essere di almeno 8 caratteri' })
    password!: string;
    
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}