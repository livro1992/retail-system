import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreWarehouseAccess } from '../../database/entites/store_warehouse_access';

@Injectable()
export class StoreWarehouseAccessService {
  constructor(
    @InjectRepository(StoreWarehouseAccess)
    private readonly accessRepository: Repository<StoreWarehouseAccess>,
  ) {}

  async listByMarketAndContext(
    marketId: string,
    storeContextKey: string,
  ): Promise<StoreWarehouseAccess[]> {
    return this.accessRepository.find({
      where: { marketId, storeContextKey },
      relations: { warehouse: true },
      order: { id: 'ASC' },
    });
  }

  async getAccessibleWarehouseIds(
    marketId: string,
    storeContextKey: string,
  ): Promise<string[]> {
    const rows = await this.accessRepository.find({
      where: { marketId, storeContextKey },
      select: { warehouseId: true },
    });
    const ids = rows.map((r) => r.warehouseId).filter(Boolean);
    if (ids.length === 0) {
      throw new BadRequestException(
        `Nessun magazzino associato al contesto negozio "${storeContextKey}" per il market ${marketId}. Popola store_warehouse_access.`,
      );
    }
    return [...new Set(ids)];
  }

  async addAccess(
    marketId: string,
    storeContextKey: string,
    warehouseId: string,
  ): Promise<StoreWarehouseAccess> {
    const entity = this.accessRepository.create({
      marketId,
      storeContextKey,
      warehouse: { warehouseId } as { warehouseId: string },
    });
    return this.accessRepository.save(entity);
  }

  async removeAccess(id: string): Promise<{ message: string }> {
    const row = await this.accessRepository.findOne({ where: { id } });
    if (!row) {
      throw new BadRequestException(`Accesso ${id} non trovato`);
    }
    await this.accessRepository.remove(row);
    return { message: 'Associazione rimossa' };
  }

  async filterToAllowedWarehouseIds(
    marketId: string,
    storeContextKey: string,
    warehouseIds: string[] | undefined,
  ): Promise<string[]> {
    const allowed = await this.getAccessibleWarehouseIds(marketId, storeContextKey);
    if (warehouseIds == null || warehouseIds.length === 0) {
      return allowed;
    }
    const allowedSet = new Set(allowed);
    const picked = warehouseIds.filter((id) => allowedSet.has(id));
    if (picked.length === 0) {
      throw new BadRequestException(
        'Nessuno dei warehouseIds richiesti è tra i magazzini consentiti per questo contesto',
      );
    }
    return picked;
  }
}
