import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./guards/jwt-auth-guard";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
    imports: [
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
    ],
    controllers: [AuthController],
    providers: [JwtAuthGuard],
    exports: [JwtAuthGuard, AuthModule] 
})
export class AuthModule {}