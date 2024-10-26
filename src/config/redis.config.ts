import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { RedisModuleAsyncOptions, RedisModuleOptions } from '@songkeys/nestjs-redis';

const configService = new ConfigService();
export function getConfigRedis(config: ConfigService) {
    return {
        host: config.get<string>(EEnvKey.REDIS_HOST),
        port: config.get<number>(EEnvKey.REDIS_PORT),
        password: config.get<string>(EEnvKey.REDIS_PASSWORD),
        db: config.get<number>(EEnvKey.REDIS_DB_NUMBER),
    };
}

export const redisConfig = getConfigRedis(configService);

export const defaultConfig = {
    ...redisConfig,
};

export const redisOptions: RedisModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: () =>
        ({
            config: {
                ...defaultConfig,
            },
            readyLog: true,
            errorLog: true,
        }) as RedisModuleOptions,
};

export const bullConfig = {
    redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
    },
};
