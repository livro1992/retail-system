import { map, Observable } from "rxjs";
import { ApiResponse } from '@retail-system/contracts';
import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((response) => {
                if (response && response.success === true) {
                    return response.data; 
                }
                
                if (response && response.success === false) {
                    const errorCode = (response.error != null) ? response.error.code : HttpStatus.BAD_REQUEST;
                    throw new HttpException(
                        response.error.description || 'Errore Microservizio', 
                        errorCode);
                }
                return response;
            })
        );
    }
}