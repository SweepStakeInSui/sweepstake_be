import { HttpModuleOptions, HttpModuleOptionsFactory, HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';

@Injectable()
export class HttpConfigService implements HttpModuleOptionsFactory {
    createHttpOptions(): HttpModuleOptions {
        return {
            timeout: 60000,
            maxRedirects: 5,
        };
    }
}

@Injectable()
export class HttpServiceBase {
    public axiosRequestConfig: AxiosRequestConfig;
    public axiosInstance: AxiosInstance;
    private logger: Logger;
    constructor(
        public httpService: HttpService,
        private loggerService: LoggerService,
    ) {
        this.axiosInstance = this.httpService.axiosRef;
        this.setLogger(HttpConfigService.name);
    }

    setLogger(loggerName: string) {
        this.logger = this.loggerService.getLogger(loggerName);
    }

    setAxiosRequestConfig(axiosRequestConfig: AxiosRequestConfig) {
        this.axiosRequestConfig = axiosRequestConfig;
    }

    getUri(config?: AxiosRequestConfig): string {
        return this.axiosInstance.getUri(config);
    }
    request<T = any, D = any>(config: AxiosRequestConfig<D>): Promise<[Error | AxiosError, T]> {
        return this.wrap<T>(this.axiosInstance.request.bind(this), config);
    }

    get<T = any>(url: string): Promise<[Error | AxiosError, T]> {
        return this.wrap<T>(this.axiosInstance.get.bind(this), url, this.axiosRequestConfig);
    }
    delete<T = any>(url: string): Promise<[Error | AxiosError, T]> {
        return this.wrap<T>(this.axiosInstance.delete.bind(this), url, this.axiosRequestConfig);
    }
    head<T = any>(url: string): Promise<[Error | AxiosError, T]> {
        return this.wrap<T>(this.axiosInstance.head.bind(this), url, this.axiosRequestConfig);
    }
    post<T = any, D = any>(url: string, data: D): Promise<[Error | AxiosError, T]> {
        return this.wrap<T>(this.axiosInstance.post.bind(this), url, data, this.axiosRequestConfig);
    }
    put<T = any, D = any>(url: string, data: D): Promise<[Error | AxiosError, T]> {
        return this.wrap<T>(this.axiosInstance.put.bind(this), url, data, this.axiosRequestConfig);
    }
    patch<T = any>(url: string, data: any): Promise<[Error | AxiosError, T]> {
        return this.wrap<T>(this.axiosInstance.patch.bind(this), url, data, this.axiosRequestConfig);
    }

    logArgs(...args) {
        let length = args?.length || 0;
        if (length > 2) {
            length = 2;
        }
        for (let i = 0; i < length - 1; i++) {
            this.logger.warn(`Arg ${i}:`, args[i]);
        }
    }

    async wrap<T>(func, ...args): Promise<[Error | AxiosError, T]> {
        try {
            const data: AxiosResponse<T> = await func(...args);
            return [null, data.data];
        } catch (e) {
            this.logger.warn(`Call http error`, e?.message);
            this.logArgs(...args);
            if (e instanceof AxiosError) {
                this.logger.warn(`Http response data:`, e?.response?.data);
                return [e, null];
            }
            return [new Error(e), null];
        }
    }
}
