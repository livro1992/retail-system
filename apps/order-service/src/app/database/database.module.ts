import { Module } from "@nestjs/common";
import { databaseProviders } from "./databse.provider";

@Module({
    providers: [...databaseProviders],
    exports: [...databaseProviders]
})
export class DatabaseModule {}