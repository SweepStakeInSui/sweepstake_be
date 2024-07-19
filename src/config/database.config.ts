import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { Entities } from '@models/entities';

const configService = new ConfigService();
export interface DatabaseConfig {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: string[];
    logging: boolean | string[] | string;
    maxQueryExecutionTime: number;
}

export function getDatabaseConfig(configService: ConfigService): DatabaseConfig {
    return {
        database: configService.get(EEnvKey.DB_DATABASE),
        entities: ['dist/**/*.entity{.ts,.js}'],
        host: configService.get(EEnvKey.DB_HOST),
        maxQueryExecutionTime: configService.get(EEnvKey.DB_MAX_QUERY_EXECUTION_TIME),
        password: configService.get(EEnvKey.DB_PASSWORD),
        port: configService.get(EEnvKey.DB_PORT),
        type: configService.get(EEnvKey.DB_TYPE),
        username: configService.get(EEnvKey.DB_USER),
        logging: false,
    };
}

export const mysqlConfig = getDatabaseConfig(configService);

export const defaultConfig = {
    ...mysqlConfig,
    autoLoadEntities: true,
};
export const typeOrmOptions: TypeOrmModuleAsyncOptions = {
    inject: [LoggerService, ConfigService],
    useFactory: (loggingService: LoggerService) =>
        ({
            ...defaultConfig,
            synchronize: true,
            entities: [...Entities],
            logger: defaultConfig.logging ? loggingService.getDbLogger('mysql') : 'debug',
            // cache: {
            //     type: 'redis',
            //     options: {
            //         ...redisConfig,
            //     },
            //     duration: 1000 * 60,
            //     ignoreErrors: true,
            // },
        }) as TypeOrmModuleOptions,
};
