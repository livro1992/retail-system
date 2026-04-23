import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { CreateOrderDto, InventoryCommand } from "@retail-system/contracts";
import { firstValueFrom, timeout } from "rxjs";


type InventoryAvailabilityCheckResponse = {
    available: boolean;
    items: {
        productId: string;
        requested: number;
        availableQuantity: number;
        available: boolean;
    }[];
};

@Injectable()
export class CommInventoryService {

    constructor(@Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy) {}

    async checkInventoryAvailability(order: CreateOrderDto): Promise<InventoryAvailabilityCheckResponse> {
        const lines = order.orderItems ?? [];
        if (lines.length === 0) {
            return { available: true, items: [] };
        }
        return await firstValueFrom(
            this.inventoryClient.send(
                { cmd: InventoryCommand.checkAvailability },
                {
                    marketId: order.marketId,
                    items: lines.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                }
            ).pipe(timeout(2500))
        ) as InventoryAvailabilityCheckResponse;
    }

    async validateOrderProducts(productIds: string[]): Promise<void> {
        if (productIds.length === 0) {
            return;
        }
        await firstValueFrom(
            this.inventoryClient
                .send({ cmd: InventoryCommand.validateOrderProducts }, { productIds })
                .pipe(timeout(2500)),
        );
    }

    async validateWarehouseForMarket(warehouseId: string, marketId: string): Promise<void> {
        await firstValueFrom(
            this.inventoryClient
                .send(
                    { cmd: InventoryCommand.validateWarehouseForMarket },
                    { warehouseId, marketId },
                )
                .pipe(timeout(2500)),
        );
    }
}