import { DataSource } from 'typeorm';
import { Product } from './entites/products';
import { Stock } from './entites/stock';
import { StockMovement } from './entites/sotck_movement';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const datasource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'inventory_db',
        entities: [Product, Stock, StockMovement],
        synchronize: true,
      });

      return datasource.initialize();
    },
  },
];
