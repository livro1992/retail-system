import { Body, Controller, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthCommand, SignInDto, UpdateUserDto, UserDto } from '@retail-system/shared'
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth-guard';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject('AUTHENTICATION_SERVICE') private client: ClientProxy
    ) {}

    @Post('sign_in')
    signIn(@Body() credentials: SignInDto) {
        return this.client.send({ cmd: AuthCommand.signIn }, credentials);
    }

    @Get('status')
    checkAuthStatus() {
        return this.client.send({ cmd: AuthCommand.checkStatus }, {});
    }

    @Post('create')
    createUser(@Body() userDto: UserDto) {
        return this.client.send({ cmd: AuthCommand.createUser }, userDto);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    getUser(@Param('id') id: number) {
        return this.client.send({ cmd: AuthCommand.getUser }, id);
    }

    @Put('update/:id')
    updateUser(@Param('id') id: number, @Body() userDto: UpdateUserDto) {
        return this.client.send({ cmd: AuthCommand.updateUser }, {
            id,
            ...userDto
        });
    }
}
