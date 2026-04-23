import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto, CreateProductsBulkDto } from '@retail-system/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../../database/entites/products';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { productId } });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return product;
  }

  async create(payload: CreateProductDto): Promise<Product> {
    const isAlreadyPresent = await this.productRepository.findOne({
        where: {
            productId: payload.productId
        }
    });

    if(isAlreadyPresent) {
      throw new BadRequestException({
        message: 'Prodotto con codice già presente'
      });
    }
    const prodId = payload.productId != null ? payload.productId : randomUUID();
    const entity = this.productRepository.create({
      ...payload,
      productId: prodId,
    });
    return this.productRepository.save(entity);
  }

  async createMany({ products }: CreateProductsBulkDto): Promise<Product[]> {
    const ids = products.map((p) => p.productId);
    const unique = new Set(ids);
    
    if (unique.size !== ids.length) {
      throw new BadRequestException({
        message: 'productId duplicati nel payload',
      });
    }
    const existing = await this.productRepository.find({
      where: { productId: In(ids) },
    });

    if (existing.length > 0) {
      throw new BadRequestException({
        message: 'Uno o più codici prodotto sono già presenti',
        productIds: existing.map((e) => e.productId),
      });
    }
    const entities = products.map((p) => this.productRepository.create(p));
    return this.productRepository.save(entities);
  }

  async update(productId: string, payload: Partial<Product>): Promise<Product> {
    const product = await this.findOne(productId);
    const merged = this.productRepository.merge(product, payload);
    return this.productRepository.save(merged);
  }

  async remove(productId: string): Promise<{ message: string }> {
    const product = await this.findOne(productId);
    await this.productRepository.remove(product);
    return { message: `Product ${productId} deleted` };
  }
}
