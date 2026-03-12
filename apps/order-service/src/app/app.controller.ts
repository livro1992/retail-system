import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';
import { OrdersCommand } from '@retail-system/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern({cmd: OrdersCommand.checkStatus })
  handleStatus() {
    console.log('riva anggot??');

    return "PONG! Il microservizio Orders è vivo e risponde.";
  }
}
