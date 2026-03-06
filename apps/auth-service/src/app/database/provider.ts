import { DataSource } from 'typeorm';
import { User } from './entities/user';


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
                database: 'auth_db',
                entities: [
                    User
                ],
                synchronize: true
            });
            return datasource.initialize();
        }
    }
]