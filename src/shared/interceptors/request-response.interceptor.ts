import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';

export const defaultResponse: IResponse<[]> = {
    statusCode: HttpStatus.OK,
    meta: {
        message: 'success',
    },
    data: null,
};

export interface IResponse<T> {
    statusCode?: HttpStatus;
    data?: T;
    meta?: {
        message: string;
        [key: string]: any;
    };
}
export function createResponse<T>(data: any): IResponse<T> {
    const defaultMeta = {
        timestamp: new Date(),
        message: data?.message ? data?.message : 'success',
    };
    return {
        statusCode: data?.statusCode ? data.statusCode : HttpStatus.OK,
        data: data?.data || data || [],
        meta: data?._metadata ? { ...data._metadata, ...defaultMeta } : { ...defaultMeta },
    };
}
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
    constructor(private readonly loggingService: LoggerService) {
        this.logger = this.loggingService.getLogger('Request');
        this.requestlogger = this.loggingService.getLogger('jsonRequest');
    }
    private logger: Logger;
    private requestlogger: Logger;

    intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
        const request = context.switchToHttp().getRequest();
        this.logger.info(request.headers, request.query, request.params);
        //TODO: optimize logger body hidden password
        return next.handle().pipe(
            map(data => {
                const ctx = context.switchToHttp();
                const response = ctx.getResponse<Response>();
                const responseData = createResponse(data);
                response.status(responseData.statusCode);
                this.requestlogger.info({
                    httpMethod: response.req.method,
                    endpointUrl: response.req.url,
                    statusCode: response.statusCode,
                    requestBody: response.req.body,
                    responseInfo: responseData,
                    error: null,
                });
                return createResponse(data);
            }),
        );
    }
}
