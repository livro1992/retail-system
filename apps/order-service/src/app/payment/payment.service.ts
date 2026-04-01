import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../database/entities/payment';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    return payment;
  }

  create(data: Partial<Payment>): Promise<Payment> {
    const entity = this.paymentRepository.create(data);
    return this.paymentRepository.save(entity);
  }

  async update(paymentId: string, data: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(paymentId);
    const merged = this.paymentRepository.merge(payment, data);
    return this.paymentRepository.save(merged);
  }

  async remove(paymentId: string): Promise<{ message: string }> {
    const payment = await this.findOne(paymentId);
    await this.paymentRepository.remove(payment);
    return { message: `Payment ${paymentId} deleted` };
  }
}
