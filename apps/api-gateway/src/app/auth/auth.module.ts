import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./guards/jwt-auth-guard";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule } from "@nestjs/config";
import { join } from "path";

@Module({
    imports: [
        ConfigModule.forRoot({
            //envFilePath: join(process.cwd(), '.env'),
            isGlobal: true
        }),
        ClientsModule.register([
        {
            name: 'AUTHENTICATION_SERVICE',
            transport: Transport.RMQ,
            options: {
                urls: ['amqp://localhost:5672'],
                queue: 'auth_queue',
                queueOptions: { durable: true },
            },
        }]),
        JwtModule.register({
            global: true, 
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        })
    ],
    controllers: [AuthController],
    providers: [JwtAuthGuard],
    exports: [JwtAuthGuard, AuthModule] 
})
export class AuthModule {}