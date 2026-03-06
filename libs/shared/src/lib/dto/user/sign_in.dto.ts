import { IsEmail, IsString } from "class-validator";

export class SignInDto {
    @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
    email!: string;

    @IsString()
    password!: string;
}