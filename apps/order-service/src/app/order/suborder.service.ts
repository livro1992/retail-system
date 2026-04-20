import {
    BadRequestException,
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
import { Order } from "../database/entities/order";
import { SubOrder } from "../database/entities/sub_order";
import { SubOrderItem } from "../database/entities/sub_order_item";
import { TimeoutError } from "rxjs";
import { CommInventoryService } from "./comm-inventory.service";

type CreateSubOrderAudit = {
    createdByUserId?: number;
};

@Injectable()
export class SubOrderService {
    constructor(
        @InjectRepository(SubOrder) private readonly subOrderRepository: Repository<SubOrder>,
        @InjectRepository(SubOrderItem) private readonly subOrderItemRepository: Repository<SubOrderItem>,
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        private readonly commInventoryService: CommInventoryService,
    ) {}

    async createSubOrder(
        dto: CreateSubOrderDto,
        audit?: CreateSubOrderAudit,
    ): Promise<SubOrder> {
        try {
            if(dto.isPaid == true && dto.parentOrderId == null) {
                throw new BadRequestException('L\'ordine che risulta pagato ma non associato ad alcun ordine');
            }

            await this._assertWarehouseMatchesParentMarket(
                dto.warehouseId ?? null,
                dto.parentOrderId ?? null,
            );

            const query = this.subOrderRepository.create({
                ...dto,
                createdByUserId: audit?.createdByUserId ?? null,
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

            if (dto.parentOrderId !== undefined 
                && sub.parentOrderId != null 
                && dto.parentOrderId != sub.parentOrderId) {
                throw new BadRequestException('Ordine già assegnato. Non è possibile cambiare')
            }
            if (dto.physicalStatus !== undefined) {
                sub.physicalStatus = dto.physicalStatus;
            }
            if (dto.isPaid !== undefined) {
                if(dto.isPaid && sub.parentOrderId == null && dto.parentOrderId == null) {
                    throw new BadRequestException('Non può essere pagato se non associato alcun ordine');
                }
                sub.isPaid = dto.isPaid;
            }
            if (dto.fulfilledByUserId !== undefined) {
                sub.fulfilledByUserId = dto.fulfilledByUserId;
            }
            if (dto.warehouseId !== undefined) {
                if (typeof dto.warehouseId === "string") {
                    await this._assertWarehouseMatchesParentMarket(
                        dto.warehouseId,
                        sub.parentOrderId,
                    );
                }
                sub.warehouseId = dto.warehouseId;
            }

            const scalarChanged =
                dto.physicalStatus !== undefined ||
                dto.isPaid !== undefined ||
                dto.fulfilledByUserId !== undefined ||
                dto.warehouseId !== undefined;
            if (scalarChanged) {
                await this.subOrderRepository.save(sub);
            }

            if (dto.items !== undefined) {
                const byLine = this._aggregateQuantitiesByOrderItem(dto.items);

                await this.subOrderItemRepository.delete({ subOrderId });

                const rows = Array.from(byLine.entries()).map(
                    ([orderItemId, quantity]) =>
                        this.subOrderItemRepository.create({
                            subOrderId,
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

    /**
     * Allinea `warehouseId` al `marketId` dell’ordine padre via inventory-service (RabbitMQ).
     */
    private async _assertWarehouseMatchesParentMarket(
        warehouseId: string | null | undefined,
        parentOrderId: string | null | undefined,
    ): Promise<void> {
        if (warehouseId == null || warehouseId === "") {
            return;
        }
        if (parentOrderId == null || parentOrderId === "") {
            throw new BadRequestException(
                "warehouseId richiede parentOrderId per validare il punto vendita.",
            );
        }
        const order = await this.orderRepository.findOne({
            where: { orderId: parentOrderId },
            select: { orderId: true, marketId: true },
        });
        if (!order) {
            throw new NotFoundException(`Ordine ${parentOrderId} non trovato`);
        }
        await this.commInventoryService.validateWarehouseForMarket(warehouseId, order.marketId);
    }

    private _rethrowKnownErrors(e: unknown): never {
        if (e instanceof TimeoutError) {
            throw new GatewayTimeoutException(
                "Inventory service timeout durante operazione su inventario",
            );
        }
        if (e instanceof HttpException || e instanceof BadRequestException) {
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
            map.set(
                line.orderItemId,
                (map.get(line.orderItemId) ?? 0) + line.quantity,
            );
        }
        return map;
    }
}
