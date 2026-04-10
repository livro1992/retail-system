/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const amqpUrl = process.env.AMQP_URL ?? 'amqp://localhost:5672';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [amqpUrl],
      queue: 'auth_queue',
    },
  });
  await app.listen();
  Logger.log(
    `🚀 Application auth-service is running (RMQ queue: auth_queue)`,
  );
}

bootstrap();
