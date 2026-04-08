import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { MovementType } from '@retail-system/shared';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../../database/entites/products';
import { Stock } from '../../database/entites/stock';
import { StockMovement } from '../../database/entites/sotck_movement';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Stock[]> {
    return this.stockRepository.find({
      relations: { product: true },
      order: { lastUpdate: 'DESC' },
    });
  }

  async findOne(stockId: string): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { stockId },
      relations: { product: true },
    });
    if (!stock) {
      throw new NotFoundException(`Stock ${stockId} not found`);
    }
    return stock;
  }

  create(payload: Partial<Stock>): Promise<Stock> {
    const entity = this.stockRepository.create(payload);
    return this.stockRepository.save(entity);
  }

  async update(stockId: string, payload: Partial<Stock>): Promise<Stock> {
    const stock = await this.findOne(stockId);
    const merged = this.stockRepository.merge(stock, payload);
    return this.stockRepository.save(merged);
  }

  async remove(stockId: string): Promise<{ message: string }> {
    const stock = await this.findOne(stockId);
    await this.stockRepository.remove(stock);
    return { message: `Stock ${stockId} deleted` };
  }

  async checkAvailability(
    marketId: string,
    items: { productId: string; quantity: number }[],
  ) {
    const checks = await Promise.all(
      items.map(async (item) => {
        const stock = await this.stockRepository.findOne({
          where: { marketId, productId: item.productId },
        });

        const availableQuantity =
          (stock?.physicalQuantity ?? 0) - (stock?.reservedQuantity ?? 0);
        const available = availableQuantity >= item.quantity;

        return {
          productId: item.productId,
          requested: item.quantity,
          availableQuantity,
          available,
        };
      }),
    );

    return {
      available: checks.every((c) => c.available),
      items: checks,
    };
  }

  /**
   * Verifica che tutti gli SKU esistano in anagrafica (prima di creare ordine operativo lato order-service).
   * Quando introdurrai reparti / zone magazzino, potrai estendere la risposta o aggiungere colonne su Product.
   */
  async validateOrderProducts(productIds: string[]): Promise<void> {
    if (productIds.length === 0) {
      return;
    }
    const unique = [...new Set(productIds)];
    const products = await this.productRepository.find({
      where: unique.map((productId) => ({ productId })),
    });
    const found = new Set(products.map((p) => p.productId));
    const missing = unique.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new BadRequestException({
        message: 'Prodotti non trovati in anagrafica inventario',
        productIds: missing,
      });
    }
  }

  /**
   * Riserva giacenza per ordine (transazione con lock pessimistico per riga stock).
   */
  async reserveStockForOrder(
    marketId: string,
    orderId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const stock = await manager.findOne(Stock, {
          where: { marketId, productId: item.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stock) {
          throw new BadRequestException(
            `Stock non presente per prodotto ${item.productId} nel punto vendita`,
          );
        }
        const available =
          stock.physicalQuantity - stock.reservedQuantity;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Disponibilita insufficiente per ${item.productId}: richiesti ${item.quantity}, disponibili ${available}`,
          );
        }
        stock.reservedQuantity += item.quantity;
        await manager.save(stock);
        await manager.save(
          manager.create(StockMovement, {
            product: { productId: item.productId } as Product,
            marketId,
            type: MovementType.RESERVE,
            quantity: item.quantity,
            orderId,
            reason: 'order_reserve',
          }),
        );
      }
    });
  }

  /**
   * Rilascia riserve create per un ordine (es. annullamento).
   */
  async releaseStockForOrder(orderId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const reserves = await manager.find(StockMovement, {
        where: { orderId, type: MovementType.RESERVE },
      });
      for (const m of reserves) {
        const stock = await manager.findOne(Stock, {
          where: { marketId: m.marketId, productId: m.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stock) {
          continue;
        }
        stock.reservedQuantity -= m.quantity;
        if (stock.reservedQuantity < 0) {
          stock.reservedQuantity = 0;
        }
        await manager.save(stock);
        await manager.save(
          manager.create(StockMovement, {
            product: { productId: m.productId } as Product,
            marketId: m.marketId,
            type: MovementType.RELEASE,
            quantity: m.quantity,
            orderId,
            reason: 'order_release',
          }),
        );
      }
    });
  }

  /**
   * Vendita immediata (cassa): decremento fisico senza passare da reserved.
   */
  async deductInstantSale(
    marketId: string,
    orderId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const stock = await manager.findOne(Stock, {
          where: { marketId, productId: item.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stock) {
          throw new BadRequestException(
            `Stock non presente per prodotto ${item.productId} nel punto vendita`,
          );
        }
        const available =
          stock.physicalQuantity - stock.reservedQuantity;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Disponibilita insufficiente per ${item.productId}: richiesti ${item.quantity}, disponibili ${available}`,
          );
        }
        stock.physicalQuantity -= item.quantity;
        await manager.save(stock);
        await manager.save(
          manager.create(StockMovement, {
            product: { productId: item.productId } as Product,
            marketId,
            type: MovementType.OUT,
            quantity: item.quantity,
            orderId,
            reason: 'instant_sale',
          }),
        );
      }
    });
  }

  getStatus(): string {
    return 'PONG! Il microservizio Inventory e vivo e risponde.';
  }
}
