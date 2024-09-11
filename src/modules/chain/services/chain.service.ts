import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SuiClient } from '@mysten/sui/client';
import { EEnvKey } from '@constants/env.constant';
import { SuiGraphQLClient } from '@mysten/sui/graphql';

@Injectable()
export class ChainService {
    protected logger: Logger;
    protected configService: ConfigService;

    private client: SuiClient;
    private gqlClient: SuiGraphQLClient;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
    ) {
        this.logger = this.loggerService.getLogger(ChainService.name);
        this.configService = configService;

        this.client = new SuiClient({
            url: this.configService.get(EEnvKey.RPC_URL),
        });

        this.gqlClient = new SuiGraphQLClient({
            url: this.configService.get(EEnvKey.GQL_URL),
        });
    }

    getChainInfo() {
        // this.client.get
    }

    getClient() {
        return this.client;
    }

    getGqlClient() {
        return this.gqlClient;
    }
}
