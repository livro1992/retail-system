import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import { Warehouse } from './warehouse';

/**
 * Collega un contesto negozio (market + chiave logica di punto vendita) ai magazzini
 * da cui l’operatore negozio può vedere attingere giacenza.
 */
@Entity('store_warehouse_access')
@Unique('UQ_store_wh_access_ctx_wh', ['marketId', 'storeContextKey', 'warehouseId'])
export class StoreWarehouseAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'market_id' })
  marketId: string;

  /** Es. id negozio fisico, slug POS, o `default` per dev / contesto unico. */
  @Column({ name: 'store_context_key', type: 'varchar', length: 128 })
  storeContextKey: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id', referencedColumnName: 'warehouseId' })
  warehouse: Warehouse;

  @RelationId((r: StoreWarehouseAccess) => r.warehouse)
  warehouseId: string;
}
