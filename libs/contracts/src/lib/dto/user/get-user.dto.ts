import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserRole } from "../../constants/user/user_roles";

export class GetUserDto implements Readonly<GetUserDto> {
    @IsString()
    userId!: number;

    @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
    email!: string;
    
    @IsEnum(UserRole)
    role?: UserRole;
  }