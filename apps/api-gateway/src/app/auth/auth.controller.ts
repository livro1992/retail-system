import { Body, Controller, ForbiddenException, Get, Inject, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthCommand, JwtPayload, Roles, SignInDto, UpdateUserDto, UserDto, UserRole } from '@retail-system/shared'
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
import { RolesAuthGuard } from './guards/roles-auth-guard';
import { sendRmqWithTimeout } from '../rmq/send-with-timeout';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject('AUTHENTICATION_SERVICE') private client: ClientProxy
    ) {}

    @Post('sign_in')
    async signIn(@Body() credentials: SignInDto) {
        return sendRmqWithTimeout(this.client, { cmd: AuthCommand.signIn }, credentials);
    }

    @Get('status')
    @Roles(UserRole.admin)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async checkAuthStatus() {
        return sendRmqWithTimeout(this.client, { cmd: AuthCommand.checkStatus }, {});
    }

    @Post('create')
    async createUser(@Body() userDto: UserDto) {
        return sendRmqWithTimeout(this.client, { cmd: AuthCommand.createUser }, userDto);
    }

    @Get('all')
    @Roles(UserRole.admin)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async getAllUsers() {
        return sendRmqWithTimeout(this.client, { cmd: AuthCommand.getAllUser }, {});
    }

    @Get(':id')
    @Roles(UserRole.admin, UserRole.user)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async getUser(@Req() req, @Param('id') id: number) {
        const currentUser: JwtPayload = req.user;

        if(currentUser.id != id && currentUser.role != UserRole.admin) {
            throw new ForbiddenException('Invalid permission');
        }
        return sendRmqWithTimeout(this.client, { cmd: AuthCommand.getUser }, id);
    }



    @Put('update/:id')
    @Roles(UserRole.admin, UserRole.user)
    @UseGuards(JwtAuthGuard, RolesAuthGuard)
    async updateUser(
        @Req() req, 
        @Param('id') id: number, 
        @Body() userDto: UpdateUserDto
    ) {
        const currentUser: JwtPayload = req.user;

        if(currentUser.id != id) {
            throw new ForbiddenException('Invalid permission');
        }
        return sendRmqWithTimeout(this.client, { cmd: AuthCommand.updateUser }, {
            id,
            ...userDto
        });
    }
}
