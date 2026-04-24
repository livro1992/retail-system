import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { MovementType } from '@retail-system/shared';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Product } from '../../database/entites/products';
import { Stock } from '../../database/entites/stock';
import { StockMovement } from '../../database/entites/sotck_movement';
import { Warehouse } from '../../database/entites/warehouse';
import { StoreWarehouseAccessService } from '../store-warehouse-access/store-warehouse-access.service';

export type StockLineInput = { warehouseId: string; productId: string; quantity: number };

type StockReleaseLine = StockLineInput & { marketId: string };

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock) private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockMovement) private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Warehouse) private readonly warehouseRepository: Repository<Warehouse>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly storeWarehouseAccessService: StoreWarehouseAccessService,
  ) {}

  findAll(): Promise<Stock[]> {
    return this.stockRepository.find({
      relations: { product: true, warehouse: true },
      order: { lastUpdate: 'DESC' },
    });
  }

  async findOne(stockId: string): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { stockId },
      relations: { product: true, warehouse: true },
    });
    if (!stock) {
      throw new NotFoundException(`Stock ${stockId} not found`);
    }
    return stock;
  }

  async create(payload: Partial<Stock> & { warehouseId?: string }): Promise<Stock> {
    const whId = payload.warehouseId ?? (payload.warehouse as Warehouse | undefined)?.warehouseId;
    if (whId == null || whId === '') {
      throw new BadRequestException('warehouseId obbligatorio per creare uno stock');
    }
    const wh = await this.warehouseRepository.findOne({ where: { warehouseId: whId } });
    if (!wh) {
      throw new NotFoundException(`Magazzino ${whId} non trovato`);
    }
    const entity = this.stockRepository.create({
      ...payload,
      marketId: wh.marketId,
      warehouse: { warehouseId: whId } as Warehouse,
    });
    return this.stockRepository.save(entity);
  }

  async update(stockId: string, payload: Partial<Stock>): Promise<Stock> {
    const stock = await this.findOne(stockId);
    if (payload.warehouseId != null && payload.warehouseId !== stock.warehouseId) {
      const wh = await this.warehouseRepository.findOne({
        where: { warehouseId: payload.warehouseId },
      });
      if (!wh) {
        throw new NotFoundException(`Magazzino ${payload.warehouseId} non trovato`);
      }
      payload = { ...payload, marketId: wh.marketId };
    }
    const merged = this.stockRepository.merge(stock, payload);
    return this.stockRepository.save(merged);
  }

  async remove(stockId: string): Promise<{ message: string }> {
    const stock = await this.findOne(stockId);
    
    await this.stockRepository.remove(stock);
    return { message: `Stock ${stockId} deleted` };
  }

  /**
   * Somma le quantità per la stessa chiave magazzino+prodotto nello stesso payload (check / reserve / scarico).
   */
  private aggregateStockLines(items: StockLineInput[]): StockLineInput[] {
    const map = new Map<string, StockLineInput>();

    for (const it of items) {
      if (it.quantity <= 0) {
        throw new BadRequestException(
          `Quantita non positiva per prodotto ${it.productId} nel magazzino ${it.warehouseId}`,
        );
      }
      const key = `${it.warehouseId}\0${it.productId}`;
      const cur = map.get(key);
      if (cur) {
        cur.quantity += it.quantity;
      } else {
        map.set(key, { ...it });
      }
    }
    return [...map.values()];
  }

  /**
   * Raggruppa movimenti RESERVE dello stesso ordine per (market, magazzino, prodotto) prima del rilascio giacenza.
   */
  private aggregateReserveMovements(movements: StockMovement[]): StockReleaseLine[] {
    const map = new Map<string, StockReleaseLine>();
    for (const m of movements) {
      if (m.warehouseId == null || m.warehouseId === '') {
        throw new BadRequestException(
          `Movimento di riserva ${m.id} senza warehouseId: eseguire backfill stock_movements prima del rilascio`,
        );
      }
      if (m.quantity <= 0) {
        throw new BadRequestException(
          `Movimento di riserva ${m.id} ha quantita non positiva`,
        );
      }
      const key = `${m.marketId}\0${m.warehouseId}\0${m.productId}`;
      const cur = map.get(key);
      if (cur) {
        cur.quantity += m.quantity;
      } else {
        map.set(key, {
          marketId: m.marketId,
          warehouseId: m.warehouseId,
          productId: m.productId,
          quantity: m.quantity,
        });
      }
    }
    return [...map.values()];
  }

  private async assertWarehousesBelongToMarket(
    manager: EntityManager,
    marketId: string,
    warehouseIds: string[],
  ): Promise<void> {
    const unique = [...new Set(warehouseIds)];
    
    if (unique.length === 0) {
      return;
    }
    const rows = await manager.find(Warehouse, {
      where: { warehouseId: In(unique), marketId },
      select: { warehouseId: true },
    });
    if (rows.length !== unique.length) {
      throw new BadRequestException(
        'Uno o piu magazzini non esistono o non appartengono al marketId dell ordine',
      );
    }
  }

  async checkAvailability(
    marketId: string,
    items: { productId: string; quantity: number; warehouseId?: string }[],
    shopStockContextKey?: string,
  ) {
    const hasWarehousePerLine = items.length > 0 && items.every((i) => i.warehouseId != null && i.warehouseId !== '');
    const hasNoWarehousePerLine = items.length > 0 && items.every((i) => i.warehouseId == null || i.warehouseId === '');

    if (items.length === 0) {
      return { available: true, items: [] as { productId: string; requested: number; availableQuantity: number; available: boolean }[] };
    }

    for (const i of items) {
      if (i.quantity <= 0) {
        throw new BadRequestException(
          `checkAvailability: quantita non positiva per prodotto ${i.productId}`,
        );
      }
    }

    if (!hasWarehousePerLine && !hasNoWarehousePerLine) {
      throw new BadRequestException(
        'checkAvailability: indicare warehouseId su tutte le righe oppure su nessuna (con shopStockContextKey)',
      );
    }

    if (hasWarehousePerLine) {
      const lines = this.aggregateStockLines(
        items.map((i) => ({
          warehouseId: i.warehouseId as string,
          productId: i.productId,
          quantity: i.quantity,
        })),
      );
      await this.assertWarehousesBelongToMarket(this.dataSource.manager, marketId, lines.map((l) => l.warehouseId));

      const checks = await Promise.all(
        lines.map(async (item) => {
          const stock = await this.stockRepository.findOne({
            where: { marketId, productId: item.productId, warehouseId: item.warehouseId },
          });
          const availableQuantity =
            (stock?.physicalQuantity ?? 0) - (stock?.reservedQuantity ?? 0);
          const available = availableQuantity >= item.quantity;
          return {
            productId: item.productId,
            warehouseId: item.warehouseId,
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

    if (shopStockContextKey == null || shopStockContextKey === '') {
      throw new BadRequestException(
        'checkAvailability senza warehouseId per riga richiede shopStockContextKey',
      );
    }

    const warehouseIds = await this.storeWarehouseAccessService.getAccessibleWarehouseIds(
      marketId,
      shopStockContextKey,
    );
    await this.assertWarehousesBelongToMarket(this.dataSource.manager, marketId, warehouseIds);

    const requestedByProduct = new Map<string, number>();
    for (const i of items) {
      requestedByProduct.set(i.productId, (requestedByProduct.get(i.productId) ?? 0) + i.quantity);
    }

    const checks = await Promise.all(
      [...requestedByProduct.entries()].map(async ([productId, requested]) => {
        const stocks = await this.stockRepository.find({
          where: { marketId, productId, warehouseId: In(warehouseIds) },
        });
        const availableQuantity = stocks.reduce(
          (sum, s) => sum + (s.physicalQuantity - s.reservedQuantity),
          0,
        );
        const available = availableQuantity >= requested;
        return {
          productId,
          requested,
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
   * Stock visibile per operatore negozio: magazzini consentiti dal contesto (e opzionale sottoinsieme warehouseIds).
   */
  async findShopStockView(params: {
    marketId: string;
    shopStockContextKey: string;
    warehouseIds?: string[];
  }): Promise<Stock[]> {
    const allowed = await this.storeWarehouseAccessService.filterToAllowedWarehouseIds(
      params.marketId,
      params.shopStockContextKey,
      params.warehouseIds,
    );
    return this.stockRepository.find({
      where: { marketId: params.marketId, warehouseId: In(allowed) },
      relations: { product: true, warehouse: true },
      order: { warehouseId: 'ASC', productId: 'ASC' },
    });
  }

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

  async reserveStockForOrder(
    marketId: string,
    orderId: string,
    items: StockLineInput[],
  ): Promise<void> {
    const lines = this.aggregateStockLines(items);
    await this.dataSource.transaction(async (manager) => {
      await this.assertWarehousesBelongToMarket(
        manager,
        marketId,
        lines.map((l) => l.warehouseId),
      );
      for (const item of lines) {
        const stock = await manager.findOne(Stock, {
          where: { marketId, productId: item.productId, warehouseId: item.warehouseId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stock) {
          throw new BadRequestException(
            `Stock non presente per prodotto ${item.productId} nel magazzino ${item.warehouseId}`,
          );
        }
        const available = stock.physicalQuantity - stock.reservedQuantity;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Disponibilita insufficiente per ${item.productId} nel magazzino ${item.warehouseId}: richiesti ${item.quantity}, disponibili ${available}`,
          );
        }
        stock.reservedQuantity += item.quantity;
        await manager.save(stock);
        await manager.save(
          manager.create(StockMovement, {
            product: { productId: item.productId } as Product,
            warehouse: { warehouseId: item.warehouseId } as Warehouse,
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

  async releaseStockForOrder(orderId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const reserves = await manager.find(StockMovement, {
        where: { orderId, type: MovementType.RESERVE },
      });
      const aggregated = this.aggregateReserveMovements(reserves);
      for (const line of aggregated) {
        const stock = await manager.findOne(Stock, {
          where: {
            marketId: line.marketId,
            productId: line.productId,
            warehouseId: line.warehouseId,
          },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stock) {
          continue;
        }
        stock.reservedQuantity -= line.quantity;
        if (stock.reservedQuantity < 0) {
          stock.reservedQuantity = 0;
        }
        await manager.save(stock);
        await manager.save(
          manager.create(StockMovement, {
            product: { productId: line.productId } as Product,
            warehouse: { warehouseId: line.warehouseId } as Warehouse,
            marketId: line.marketId,
            type: MovementType.RELEASE,
            quantity: line.quantity,
            orderId,
            reason: 'order_release',
          }),
        );
      }
    });
  }

  async deductInstantSale(
    marketId: string,
    orderId: string,
    items: StockLineInput[],
  ): Promise<void> {
    const lines = this.aggregateStockLines(items);
    await this.dataSource.transaction(async (manager) => {
      await this.assertWarehousesBelongToMarket(
        manager,
        marketId,
        lines.map((l) => l.warehouseId),
      );
      for (const item of lines) {
        const stock = await manager.findOne(Stock, {
          where: { marketId, productId: item.productId, warehouseId: item.warehouseId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stock) {
          throw new BadRequestException(
            `Stock non presente per prodotto ${item.productId} nel magazzino ${item.warehouseId}`,
          );
        }
        const available = stock.physicalQuantity - stock.reservedQuantity;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Disponibilita insufficiente per ${item.productId} nel magazzino ${item.warehouseId}: richiesti ${item.quantity}, disponibili ${available}`,
          );
        }
        stock.physicalQuantity -= item.quantity;
        await manager.save(stock);
        await manager.save(
          manager.create(StockMovement, {
            product: { productId: item.productId } as Product,
            warehouse: { warehouseId: item.warehouseId } as Warehouse,
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
