import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client';

@Controller('inventory')
export class InventoryController {
    constructor(
        @Inject('INVENTORY_SERVICE') private client: ClientProxy
    ) {}

    @Get('health')
    health() : { message: string } {
        return { message: 'L\'Inventario sarà presto agganciato alla soluzione' };
    }

    @Get('status')
    checkInventoryStatus() {
        return this.client.send({ cmd: 'check_status' }, {});
    }
}
