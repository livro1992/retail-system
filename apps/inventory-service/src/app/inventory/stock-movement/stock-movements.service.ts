import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../../database/entites/sotck_movement';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
  ) {}

  findAll(): Promise<StockMovement[]> {
    return this.movementRepository.find({
      relations: { product: true, warehouse: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<StockMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: { product: true, warehouse: true },
    });
    if (!movement) {
      throw new NotFoundException(`Stock movement ${id} not found`);
    }
    return movement;
  }

  create(payload: Partial<StockMovement>): Promise<StockMovement> {
    const entity = this.movementRepository.create(payload);
    return this.movementRepository.save(entity);
  }

  async update(id: string, payload: Partial<StockMovement>): Promise<StockMovement> {
    const movement = await this.findOne(id);
    const merged = this.movementRepository.merge(movement, payload);
    return this.movementRepository.save(merged);
  }

  async remove(id: string): Promise<{ message: string }> {
    const movement = await this.findOne(id);
    await this.movementRepository.remove(movement);
    return { message: `Stock movement ${id} deleted` };
  }
}
