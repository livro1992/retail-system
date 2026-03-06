import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
  ) {}

  @MessagePattern({cmd: 'check_status'})
  handleStatus() {
    return "PONG! Il microservizio Inventory è vivo e risponde.";
  }
}
