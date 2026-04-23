import { Body, Controller, Delete, Get, Headers, HttpException, Param, Post, Put, UnauthorizedException } from '@nestjs/common';
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

    private _userIdFromHeader(xUserId?: string): number | undefined {
        if (xUserId == null || xUserId === '') {
            return undefined;
        }
        const n = parseInt(xUserId, 10);
        return Number.isFinite(n) ? n : undefined;
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

    @Get('/suborder')
    getSubOrders(@Headers('x-user-id') xUserId: number) {
        return this.suborderService.getSubOrders(xUserId);
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
