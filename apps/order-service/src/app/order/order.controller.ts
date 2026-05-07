import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpException, Param, Post, Put, UnauthorizedException } from '@nestjs/common';
import {
    CreateOrderDto,
    CreateSubOrderDto,
    UpdateSubOrderDto,
} from '@retail-system/shared';
import { OrderService } from './order.service';
import { SubOrderService } from './suborder.service';

@Controller('order')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly suborderService: SubOrderService
    ) {}

    private _userIdFromHeader(xUserId?: string): string | undefined {
        if (xUserId == null || xUserId === '') {
            return undefined;
        }
        const normalized = xUserId.trim();
        return normalized !== '' ? normalized : undefined;
    }

    @Post()
    createOrder(
        @Body() orderDto: CreateOrderDto,
        @Headers('x-user-id') xUserId?: string,
    ) {
        const createdByUserId = this._userIdFromHeader(xUserId);

        if(createdByUserId == undefined) {
            throw new UnauthorizedException('Invalid user');
        }
        return this.orderService.createOrder(
            orderDto, {
                createdByUserId: createdByUserId
            }
        );
    }

    @Post('suborder')
    createSuborder(
        @Body() subOrder: CreateSubOrderDto,
        @Headers('x-user-id') xUserId?: string,
    ) {
        const createdByUserId = this._userIdFromHeader(xUserId);
        return this.suborderService.createSubOrder(
            subOrder,
            createdByUserId !== undefined ? { createdByUserId } : undefined,
        );
    }

    @Put('suborder/:subOrderId')
    updateSuborder(
        @Param('subOrderId') subOrderId: string,
        @Body() dto: UpdateSubOrderDto,
    ) {
        return this.suborderService.updateSubOrder(subOrderId, dto);
    }

    /** Collega il suborder all’ordine (cassa): le righe suborder devono già riferire OrderItem di questo ordine. */
    @Post(':orderId/suborder/:subOrderId/materialize')
    materializeSubOrderToOrderItems(
        @Param('orderId') orderId: string,
        @Param('subOrderId') subOrderId: string,
    ) {
        return this.orderService.materializeSubOrderToOrderItems(
            orderId,
            subOrderId,
        );
    }

    @Get('suborders/pending-for-warehouse')
    getPendingSubOrdersForWarehouse(
        @Headers('x-warehouse-id') warehouseId?: string,
    ) {
        const w = warehouseId?.trim();
        if (w == null || w === '') {
            throw new BadRequestException('Header x-warehouse-id obbligatorio');
        }
        return this.suborderService.findPendingForWarehouse(w);
    }

    @Get('suborder')
    getSubOrders(@Headers('x-user-id') xUserId?: string) {
        const id = this._userIdFromHeader(xUserId);
        if (id == null) {
            throw new BadRequestException('Header x-user-id obbligatorio');
        }
        return this.suborderService.getSubOrders(id);
    }

    @Get()
    getAllOrders() {
        return this.orderService.getAllOrders();
    }

    @Get(':id')
    getOrderById(@Param('id') id: string) {
        return this.orderService.getOrderById(id);
    }

    @Put(':id')
    updateOrder(@Param('id') id: string, @Body() orderDto: Partial<CreateOrderDto>) {
        return this.orderService.updateOrder(id, orderDto);
    }

    @Delete(':id')
    deleteOrder(@Param('id') id: string) {
        return this.orderService.deleteOrder(id);
    }
}
