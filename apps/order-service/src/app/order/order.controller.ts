import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
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

    @Post()
    createOrder(@Body() orderDto: CreateOrderDto) {
        return this.orderService.createOrder(orderDto);
    }

    @Post('suborder')
    createSuborder(@Body() subOrder: CreateSubOrderDto) {
        return this.suborderService.createSubOrder(subOrder);
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
