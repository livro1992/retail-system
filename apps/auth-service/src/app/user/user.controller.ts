import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthCommand, SignInDto, UpdateUserDto, UserDto } from '@retail-system/shared'
import { UserService } from './user.service';
import { User } from '../database/entities/user';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) {}

    @MessagePattern({ cmd: AuthCommand.createUser })
    createUser(@Payload() userDto: UserDto) {
        return this.userService.createUser(userDto);
    }

    @MessagePattern({ cmd: AuthCommand.getUser })
    getUser(@Payload() id: User["userId"]) {
        return this.userService.getUser(id);
    }

    @MessagePattern({ cmd: AuthCommand.updateUser })
    updateUser(@Payload() data: { id: number } & UpdateUserDto) {
        const { id, ...userDto } = data;
        return this.userService.updateUser(id, userDto);
    }

    @MessagePattern({ cmd: AuthCommand.signIn })
    signIn(@Payload() credentials: SignInDto) {
        return this.userService.signIn(credentials);
    }
}
