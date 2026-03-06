import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const status = exception instanceof HttpException 
            ? exception.getStatus() 
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException 
            ? exception.getResponse() 
            : 'Internal server error';

        const apiResponse = {
            success: false,
            message: typeof message === 'object' ? (message as any).message : message,
            error: {
                code: exception?.name || 'UNKNOWN_ERROR',
                details: typeof message === 'object' ? (message as any).error : undefined,
            },
            timestamp: new Date().toISOString(),
        };
    }
}