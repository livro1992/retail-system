import { Body, Controller, ForbiddenException, Get, Inject, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthCommand, JwtPayload, Roles, SignInDto, UpdateUserDto, UserDto, UserRole } from '@retail-system/shared'
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
import { RolesAuthGuard } from './guards/roles-auth-guard';

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
    @Roles(UserRole.admin)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    checkAuthStatus() {
        return this.client.send({ cmd: AuthCommand.checkStatus }, {});
    }

    @Post('create')
    createUser(@Body() userDto: UserDto) {
        return this.client.send({ cmd: AuthCommand.createUser }, userDto);
    }

    @Get('all')
    @Roles(UserRole.admin)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    getAllUsers() {
        return this.client.send({ cmd: AuthCommand.getAllUser }, {});
    }

    @Get(':id')
    @Roles(UserRole.admin, UserRole.user)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    getUser(@Req() req, @Param('id') id: number) {
        const currentUser: JwtPayload = req.user;

        if(currentUser.id != id && currentUser.role != UserRole.admin) {
            throw new ForbiddenException('Invalid permission');
        }
        return this.client.send({ cmd: AuthCommand.getUser }, id);
    }



    @Put('update/:id')
    @Roles(UserRole.admin, UserRole.user)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    updateUser(
        @Req() req, 
        @Param('id') id: number, 
        @Body() userDto: UpdateUserDto
    ) {
        const currentUser: JwtPayload = req.user;

        if(currentUser.id != id) {
            throw new ForbiddenException('Invalid permission');
        }
        return this.client.send({ cmd: AuthCommand.updateUser }, {
            id,
            ...userDto
        });
    }
}
