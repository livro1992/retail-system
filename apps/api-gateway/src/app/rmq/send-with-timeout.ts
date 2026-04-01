import { GatewayTimeoutException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';

/** Timeout default per request/response su RabbitMQ (gateway → microservizi). */
export const RMQ_DEFAULT_TIMEOUT_MS = 8000;

/** Timeout per chiamate HTTP verso downstream (es. order-service). */
export const HTTP_DOWNSTREAM_TIMEOUT_MS = 10000;

export async function sendRmqWithTimeout<T>(
  client: ClientProxy,
  pattern: Record<string, string>,
  payload: unknown,
  timeoutMs = RMQ_DEFAULT_TIMEOUT_MS,
): Promise<T> {
  try {
    return await firstValueFrom(
      client.send<T>(pattern, payload).pipe(timeout(timeoutMs)),
    );
  } catch (e) {
    if (e instanceof TimeoutError) {
      throw new GatewayTimeoutException(
        'Il servizio non ha risposto entro il tempo limite',
      );
    }
    throw e;
  }
}
