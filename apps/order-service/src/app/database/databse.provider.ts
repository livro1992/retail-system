import { DataSource } from 'typeorm';
import { Order } from './entities/order';
import { Package } from './entities/package';

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
                database: 'order_db',
                entities: [
                    Order,
                    Package
                ],
                synchronize: true
            });
            return datasource.initialize();
        }
    }
]