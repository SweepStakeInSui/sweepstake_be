import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { RedisModuleAsyncOptions, RedisModuleOptions } from '@songkeys/nestjs-redis';

const configService = new ConfigService();
export function getConfigKafka(config: ConfigService) {
    return {
        host: config.get<string>(EEnvKey.KAFKA_HOST),
        port: config.get<number>(EEnvKey.KAFKA_PORT),
    };
}

export const redisConfig = getConfigKafka(configService);

export const defaultConfig = {
    ...redisConfig,
};

export const kafkaOptions: RedisModuleAsyncOptions = {
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
