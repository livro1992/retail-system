import { Injectable } from '@nestjs/common';

@Injectable()
export class StockMovementsService {
  findAll() {
    return { message: 'Stock movements base service ready', data: [] };
  }
}
