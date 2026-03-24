import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../database/entites/products';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  findAll() {
    return this.productRepository.find();
  }

  async findOne(productId: string) {
    const product = await this.productRepository.findOne({ where: { productId } });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return product;
  }

  async create(payload: Product) {
    const entity = this.productRepository.create(payload);
    return this.productRepository.save(entity);
  }

  async update(productId: string, payload: Partial<Product>) {
    const product = await this.findOne(productId);
    const merged = this.productRepository.merge(product, payload);
    return this.productRepository.save(merged);
  }

  async remove(productId: string) {
    const product = await this.findOne(productId);
    await this.productRepository.remove(product);
    return { message: `Product ${productId} deleted` };
  }
}
