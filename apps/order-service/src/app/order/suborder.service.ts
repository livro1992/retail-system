import {
    GatewayTimeoutException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    CreateSubOrderDto,
    UpdateSubOrderDto,
} from "@retail-system/contracts";
import { SubOrder } from "../database/entities/sub_order";
import { SubOrderItem } from "../database/entities/sub_order_item";
import { TimeoutError } from "rxjs";

type CreateSubOrderAudit = {
    createdByUserId?: number;
};

@Injectable()
export class SubOrderService {
    constructor(
        @InjectRepository(SubOrder) private readonly subOrderRepository: Repository<SubOrder>,
        @InjectRepository(SubOrderItem)
        private readonly subOrderItemRepository: Repository<SubOrderItem>,
    ) {}

    async createSubOrder(
        dto: CreateSubOrderDto,
        audit?: CreateSubOrderAudit,
    ): Promise<SubOrder> {
        try {
            const { items = [], ...rest } = dto;
            const byLine = this._aggregateQuantitiesByOrderItem(items);
            const query = this.subOrderRepository.create({
                ...rest,
                createdByUserId: audit?.createdByUserId ?? null,
                items: Array.from(byLine.entries()).map(([orderItemId, quantity]) =>
                    this.subOrderItemRepository.create({ orderItemId, quantity }),
                ),
            });
            return await this.subOrderRepository.save(query);
        } catch (e) {
            this._rethrowKnownErrors(e);
        }
    }

    async updateSubOrder(
        subOrderId: string,
        dto: UpdateSubOrderDto,
    ): Promise<SubOrder> {
        const hasPayload =
            dto.parentOrderId !== undefined ||
            dto.physicalStatus !== undefined ||
            dto.isPaid !== undefined ||
            dto.items !== undefined ||
            dto.fulfilledByUserId !== undefined ||
            dto.warehouseId !== undefined;

        if (!hasPayload) {
            return this._getSubOrderByIdOrThrow(subOrderId);
        }

        try {
            const sub = await this.subOrderRepository.findOne({
                where: { subOrderId },
            });
            if (!sub) {
                throw new NotFoundException(`Sub-ordine ${subOrderId} non trovato`);
            }

            if (dto.parentOrderId !== undefined) {
                sub.parentOrderId = dto.parentOrderId;
            }
            if (dto.physicalStatus !== undefined) {
                sub.physicalStatus = dto.physicalStatus;
            }
            if (dto.isPaid !== undefined) {
                sub.isPaid = dto.isPaid;
            }
            if (dto.fulfilledByUserId !== undefined) {
                sub.fulfilledByUserId = dto.fulfilledByUserId;
            }
            if (dto.warehouseId !== undefined) {
                sub.warehouseId = dto.warehouseId;
            }

            const scalarChanged =
                dto.parentOrderId !== undefined ||
                dto.physicalStatus !== undefined ||
                dto.isPaid !== undefined ||
                dto.fulfilledByUserId !== undefined ||
                dto.warehouseId !== undefined;
            if (scalarChanged) {
                await this.subOrderRepository.save(sub);
            }

            if (dto.items !== undefined) {
                const byLine = this._aggregateQuantitiesByOrderItem(dto.items);

                await this.subOrderItemRepository
                    .createQueryBuilder()
                    .delete()
                    .from(SubOrderItem)
                    .where("sub_order_id = :id", { id: subOrderId })
                    .execute();

                const rows = Array.from(byLine.entries()).map(
                    ([orderItemId, quantity]) =>
                        this.subOrderItemRepository.create({
                            subOrder: { subOrderId } as SubOrder,
                            orderItemId,
                            quantity,
                        }),
                );
                await this.subOrderItemRepository.save(rows);
            }

            return this._getSubOrderByIdOrThrow(subOrderId);
        } catch (e) {
            this._rethrowKnownErrors(e);
        }
    }

    async getSubOrders(userId: number): Promise<SubOrder[]> {
        try {
            return await this.subOrderRepository.find({
                where: { createdByUserId: userId },
            });
        } catch (e) {
            this._rethrowKnownErrors(e);
        }
    }

    private _rethrowKnownErrors(e: unknown): never {
        if (e instanceof TimeoutError) {
            throw new GatewayTimeoutException(
                "Inventory service timeout durante operazione su inventario",
            );
        }
        if (e instanceof HttpException) {
            throw e;
        }
        const err = e as {
            response?: unknown;
            status?: number;
            message?: string;
        };

        if (err?.response !== undefined) {
            throw new HttpException(
                err.response,
                err.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
        throw new HttpException(
            "Errore interno su sub-ordine",
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }

    private async _getSubOrderByIdOrThrow(subOrderId: string): Promise<SubOrder> {
        const found = await this.subOrderRepository.findOne({
            where: { subOrderId },
            relations: { items: true },
        });
        if (!found) {
            throw new NotFoundException(`Sub-ordine ${subOrderId} non trovato`);
        }
        return found;
    }

    private _aggregateQuantitiesByOrderItem(
        items: { orderItemId: string; quantity: number }[],
    ): Map<string, number> {
        const map = new Map<string, number>();
        for (const line of items) {
            const key = line.orderItemId.trim();
            map.set(key, (map.get(key) ?? 0) + line.quantity);
        }
        return map;
    }
}
