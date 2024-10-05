import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { CrawlerService } from './crawler.service';
import { SuiEvent } from '@mysten/sui/dist/cjs/client';
import { EEnvKey } from '@constants/env.constant';
import { MarketRepository } from '@models/repositories/market.repository';

@Injectable()
export class EventService {
    protected logger: Logger;
    protected configService: ConfigService;

    private sweepstakeContract: string;
    private conditionalMarketContract: string;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly marketRepository: MarketRepository,
    ) {
        this.logger = this.loggerService.getLogger(CrawlerService.name);
        this.configService = configService;

        this.sweepstakeContract = this.configService.get(EEnvKey.SWEEPSTAKE_CONTRACT);
        this.conditionalMarketContract = this.configService.get(EEnvKey.CONDITIONAL_MARKET_CONTRACT);
    }

    public async proccessEvent(events: SuiEvent[]) {
        console.log('Event proccessed: ', events);

        for (const event of events) {
            console.log('Event proccessed: ', event);

            switch (event.type) {
                case `${this.conditionalMarketContract}::conditional_market::NewMarketEvent`: {
                    console.log(event.parsedJson);

                    const marketInfo = await this.marketRepository.findOneBy({
                        id: (event.parsedJson as any).id,
                    });

                    if (marketInfo) {
                        marketInfo.isActive = true;
                        marketInfo.onchainId = (event.parsedJson as any).object_id;
                    }

                    await this.marketRepository.save(marketInfo);
                    break;
                }
            }
        }
    }
}
