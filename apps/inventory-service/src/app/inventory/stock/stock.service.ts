import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../../database/entites/stock';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
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

  getStatus(): string {
    return 'PONG! Il microservizio Inventory e vivo e risponde.';
  }
}
