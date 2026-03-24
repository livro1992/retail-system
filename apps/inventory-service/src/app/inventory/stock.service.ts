import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stock } from '../database/entites/stock';
import { Repository } from 'typeorm';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  findAll() {
    return this.stockRepository.find();
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
