import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { AuthCommand } from '@retail-system/shared';

@Controller('auth')
export class AppController {
  constructor(@Inject('AUTHENTICATION_SERVICE') private client: ClientProxy) {}


  @MessagePattern({cmd: AuthCommand.checkStatus})
  handleStatus() {
    return "PONG! Il microservizio Auth è vivo e risponde.";
  }
}
