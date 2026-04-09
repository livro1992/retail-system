import { HttpException } from '@nestjs/common';
import { isAxiosError } from 'axios';

export const DEFAULT_GATEWAY_INTERNAL_ERROR = 'Errore interno del Gateway';

export type RethrowDownstreamOptions = {
  /** Messaggio 503 quando il downstream non risponde (solo richiesta, nessuna risposta). */
  serviceUnavailableMessage: string;
  /** Messaggio 500 per errori non classificati come Axios verso il downstream. */
  internalMessage?: string;
};

/**
 * Converte errori Axios da chiamate HTTP verso altri servizi in {@link HttpException}
 * per il client del gateway: propaga status/body del downstream, oppure 503 / 500.
 * In seguito si possono aggiungere log, metriche o mappature qui senza toccare i controller.
 */
export function rethrowDownstreamHttpError(
  error: unknown,
  options: string | RethrowDownstreamOptions,
): never {
  const opts: RethrowDownstreamOptions =
    typeof options === 'string'
      ? { serviceUnavailableMessage: options }
      : options;
  const internal = opts.internalMessage ?? DEFAULT_GATEWAY_INTERNAL_ERROR;

  if (isAxiosError(error)) {
    if (error.response) {
      throw new HttpException(error.response.data, error.response.status);
    }
    if (error.request) {
      throw new HttpException(opts.serviceUnavailableMessage, 503);
    }
  }

  throw new HttpException(internal, 500);
}
