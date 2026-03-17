import { DataSource } from 'typeorm';
import { Order } from './entities/order';
import { OrderItem } from './entities/order_item';

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
                    OrderItem
                ],
                synchronize: true
            });
            return datasource.initialize();
        }
    }
]