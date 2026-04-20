import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../database/entites/warehouse';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({ order: { createdAt: 'DESC' } });
  }

  findByMarketId(marketId: string): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { marketId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(warehouseId: string): Promise<Warehouse> {
    const row = await this.warehouseRepository.findOne({ where: { warehouseId } });
    if (!row) {
      throw new NotFoundException(`Magazzino ${warehouseId} non trovato`);
    }
    return row;
  }

  create(payload: Pick<Warehouse, 'marketId'> & { name?: string | null }): Promise<Warehouse> {
    const entity = this.warehouseRepository.create({
      marketId: payload.marketId,
      name: payload.name ?? null,
    });
    return this.warehouseRepository.save(entity);
  }

  async update(
    warehouseId: string,
    payload: Partial<Pick<Warehouse, 'marketId' | 'name'>>,
  ): Promise<Warehouse> {
    const row = await this.findOne(warehouseId);
    const merged = this.warehouseRepository.merge(row, payload);
    return this.warehouseRepository.save(merged);
  }

  async remove(warehouseId: string): Promise<{ message: string }> {
    const row = await this.findOne(warehouseId);
    await this.warehouseRepository.remove(row);
    return { message: `Magazzino ${warehouseId} eliminato` };
  }

  /**
   * Usato da order-service via RabbitMQ: stesso `marketId` dell’ordine / punto vendita.
   */
  async assertWarehouseBelongsToMarket(warehouseId: string, marketId: string): Promise<void> {
    const row = await this.warehouseRepository.findOne({ where: { warehouseId } });
    if (!row) {
      throw new NotFoundException(`Magazzino ${warehouseId} non trovato`);
    }
    if (row.marketId !== marketId) {
      throw new BadRequestException(
        `Il magazzino ${warehouseId} non appartiene al punto vendita indicato (marketId atteso: ${marketId})`,
      );
    }
  }
}
