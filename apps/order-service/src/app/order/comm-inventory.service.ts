import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto, InventoryCommand } from '@retail-system/contracts';
import { firstValueFrom, timeout } from 'rxjs';

type InventoryAvailabilityCheckResponse = {
  available: boolean;
  items: {
    productId: string;
    warehouseId?: string;
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

    const allHaveWarehouse = lines.every(
      (l) => l.warehouseId != null && l.warehouseId !== '',
    );
    const noneHaveWarehouse = lines.every(
      (l) => l.warehouseId == null || l.warehouseId === '',
    );

    if (!allHaveWarehouse && !noneHaveWarehouse) {
      throw new BadRequestException(
        'warehouseId deve essere presente su tutte le righe ordine oppure su nessuna (in quel caso serve inventoryShopContextKey)',
      );
    }

    if (allHaveWarehouse) {
      return (await firstValueFrom(
        this.inventoryClient
          .send(
            { cmd: InventoryCommand.checkAvailability },
            {
              marketId: order.marketId,
              items: lines.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                warehouseId: item.warehouseId as string,
              })),
            },
          )
          .pipe(timeout(2500)),
      )) as InventoryAvailabilityCheckResponse;
    }

    const ctx = order.inventoryShopContextKey?.trim();
    if (ctx == null || ctx === '') {
      throw new BadRequestException(
        'Senza warehouseId sulle righe specificare inventoryShopContextKey per la disponibilita aggregata sui magazzini del contesto negozio',
      );
    }

    return (await firstValueFrom(
      this.inventoryClient
        .send(
          { cmd: InventoryCommand.checkAvailability },
          {
            marketId: order.marketId,
            shopStockContextKey: ctx,
            items: lines.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        )
        .pipe(timeout(2500)),
    )) as InventoryAvailabilityCheckResponse;
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
