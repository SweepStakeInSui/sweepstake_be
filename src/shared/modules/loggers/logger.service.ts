import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { Logger, QueryRunner } from 'typeorm';
import { configure, getLogger, Appender, Layout, Logger as FourLogger, addLayout } from 'log4js';

const layouts: Record<string, Layout> = {
    console: {
        type: 'pattern',
        pattern: '%[%-6p %d [%c] | %m%]',
    },
    dateFile: {
        type: 'pattern',
        pattern: '%-6p %d [%c] | %m',
    },
    access: {
        type: 'pattern',
        pattern: '%[%-6p %d [%c] [address:%x{remoteAddr}] %x{access}%]',
        tokens: {
            remoteAddr: function (logEvent) {
                let remoteAddr = logEvent.data.toString().split(' ', 1).pop();
                remoteAddr = remoteAddr.replace(/^.*:/, '');
                remoteAddr = remoteAddr === '1' ? '127.0.0.1' : remoteAddr;
                return remoteAddr;
            },
            access: function (logEvent) {
                const [, ...data] = logEvent.data.toString().split(' ');
                data.pop();
                return data.join(' ');
                9;
            },
        },
    },
};

const appenders: Record<string, Appender> = {
    dateFileJson: {
        type: 'dateFile',
        layout: {
            type: 'jsonRequest',
            separator: ',',
        },
        filename: 'logs/out.log',
        pattern: '-yyyy-MM-dd',
    },
    console: {
        type: 'console',
        layout: layouts.console,
    },
    dateFile: {
        type: 'dateFile',
        filename: 'logs/out.log',
        pattern: '-yyyy-MM-dd',
        layout: layouts.dateFile,
    },
    access: {
        type: 'console',
        layout: layouts.access,
    },
    dateFileAccess: {
        type: 'dateFile',
        filename: 'logs/out.log',
        pattern: '-yyyy-MM-dd',
        layout: layouts.access,
    },
    multi: {
        type: 'multiFile',
        base: 'logs/',
        property: 'categoryName',
        extension: '.log',
    },
};

class DbLogger implements Logger {
    constructor(private logger: FourLogger) {}

    /**
     * Logs query and parameters used in it.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
        this.logger.debug(`query=${query}` + (parameters ? ` parameters=${JSON.stringify(parameters)}` : ``));
    }

    /**
     * Logs query that is failed.
     */
    logQueryError(
        error: any,
        query: string,
        parameters?: any[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        queryRunner?: QueryRunner,
    ): any {
        this.logger.debug(error);
        const errorMessage = error.message ? error.message : error;
        this.logger.error(errorMessage);
        this.logger.error(`query=${query} parameters=${JSON.stringify(parameters)}`);
    }

    /**
     * Logs query that is slow.
     */
    logQuerySlow(
        time: number,
        query: string,
        parameters?: any[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        queryRunner?: QueryRunner,
    ): any {
        //Notify in developer check
        this.logger.debug(`Time = ${time}ms query=${query} parameters=${JSON.stringify(parameters)}`);
    }

    /**
     * Logs events from the schema build process.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logSchemaBuild(message: string, queryRunner?: QueryRunner): any {
        this.logger.info(message);
    }

    /**
     * Logs events from the migrations run process.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logMigration(message: string, queryRunner?: QueryRunner): any {
        this.logger.info(message);
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(
        level: 'log' | 'info' | 'warn',
        message: any,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        queryRunner?: QueryRunner,
    ): any {
        this.logger[level](message);
    }
}

@Injectable()
export class LoggerService {
    /**
     * config logging
     * @example
     * Import Logging module
     * constructor(protected loggingService: LoggingService) {}
     * logger = this.loggingService.getLogger('serviceA');
     */
    constructor(private configService: ConfigService) {
        const level = configService.get(EEnvKey.LOG_LEVEL);
        const isWriteLog = configService.get(EEnvKey.IS_WRITE_LOG) === 'true';
        addLayout('jsonRequest', function () {
            return function (logEvent) {
                const logData = logEvent.data[0];
                const requestBody = logData.requestBody;
                if (Object.hasOwn(requestBody, 'fromPrivateKey')) {
                    requestBody['fromPrivateKey'] = '******';
                }
                return JSON.stringify(
                    {
                        timestamp: logEvent.startTime,
                        logLevel: logEvent.level.levelStr,
                        httpStatusCode: logData.statusCode,
                        httpMethod: logData.httpMethod,
                        endpointUrl: logData.endpointUrl,
                        requestBody: logData.requestBody,
                        responseInfo: logData.responseInfo,
                        errorDetails: logData.error,
                    },
                    null,
                    4,
                );
            };
        });

        configure({
            appenders: appenders,
            categories: {
                default: {
                    appenders: ['console'],
                    level: level,
                    enableCallStack: true,
                },
                jsonRequest: {
                    appenders: isWriteLog ? ['dateFileJson'] : ['console'],
                    level: level,
                    enableCallStack: true,
                },
                access: {
                    appenders: isWriteLog ? ['access', 'dateFileAccess'] : ['access'],
                    level: 'info',
                    enableCallStack: true,
                },
            },
        });
    }

    getLogger = getLogger;

    private _access = () => {
        const logger = this.getLogger('access');
        return {
            write: logger.info.bind(logger),
        };
    };

    logger = {
        default: getLogger('default'),
        access: this._access(),
    };

    getDbLogger(category: string) {
        return new DbLogger(this.getLogger(category));
    }
}
