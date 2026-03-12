import { UserRole } from "../../constants/user/user_roles";
import { IsOptional, IsString, IsEmail, IsEnum, MinLength } from "class-validator";

export class UserDto implements Readonly<UserDto> {
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La password deve essere di almeno 8 caratteri' })
  password!: string;
  
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}