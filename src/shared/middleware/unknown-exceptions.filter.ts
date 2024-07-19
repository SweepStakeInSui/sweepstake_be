import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { IResponse } from '@shared/interceptors/request-response.interceptor';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';

@Catch()
export class UnknownExceptionsFilter implements ExceptionFilter {
    constructor(private readonly loggingService: LoggerService) {
        this.logger = this.loggingService.getLogger('unknown-exception');
        this.requestlogger = this.loggingService.getLogger('jsonRequest');
    }

    private logger: Logger;
    private requestlogger: Logger;

    catch(exception: Error, host: ArgumentsHost) {
        this.logger.error(exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const responseData: IResponse<any> = {
            data: null,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            meta: {
                message: exception instanceof Error && exception?.message ? exception.message : 'unknown exception',
            },
        };

        this.requestlogger.error({
            httpMethod: response.req.method,
            endpointUrl: response.req.url,
            statusCode: responseData.statusCode,
            requestBody: response.req.body,
            responseInfo: responseData,
            error: {
                message: exception.message,
                stack: exception.stack,
            },
        });
        response.status(responseData.statusCode).json(responseData);
    }
}
