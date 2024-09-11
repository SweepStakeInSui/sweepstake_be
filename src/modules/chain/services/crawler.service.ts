import { ChainRepository } from '@models/repositories/chain.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';

@Injectable()
export class CrawlerService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly chainRepository: ChainRepository,
    ) {
        this.logger = this.loggerService.getLogger(CrawlerService.name);
        this.configService = configService;
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async createCrawlJob() {
        this.logger.info('Called every minute');

        const chainInfos = await this.chainRepository.findBy({});

        chainInfos.map(() => {});

        // Create a provider instance

        // Get last block from db
        // Get current block from the provider

        // Calculate the range of blocks to query, max 10000 blocks, if less than 10 block, skip

        // Get the contract addresses from the config

        // Push to job queue

        // save to Db the latest block status
    }

    // private async getSuiBlockrange(currentBlock: number) {
    // Get the latest block from the sui chain
    // Get the latest block from the db
    // Calculate the range of blocks to query
    // const lastBlock =
    // }
}
