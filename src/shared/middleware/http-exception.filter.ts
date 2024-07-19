import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { IResponse } from '@shared/interceptors/request-response.interceptor';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly loggingService: LoggerService) {
        this.logger = this.loggingService.getLogger('http-exception');
        this.requestlogger = this.loggingService.getLogger('jsonRequest');
    }

    private logger: Logger;
    private requestlogger: Logger;

    catch(exception: HttpException, host: ArgumentsHost) {
        this.logger.error(exception);

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const excResponse = exception.getResponse() as IResponse<any> | any;
        const responseData: IResponse<any> = {
            statusCode: exception.getStatus() ? exception.getStatus() : HttpStatus.BAD_REQUEST,
            data: excResponse.data ? excResponse.data : null,
            meta: {
                message: '',
            },
        };

        if (typeof excResponse !== 'object') {
            responseData.meta = {
                message: excResponse ? excResponse : 'unknown message',
            };
        } else {
            if (excResponse.meta) {
                responseData.meta = excResponse.meta;
            } else {
                responseData.meta = {
                    message: excResponse.message ? excResponse.message : 'unknown message',
                };
            }
        }

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
