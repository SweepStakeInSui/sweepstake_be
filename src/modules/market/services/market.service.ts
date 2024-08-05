import { MarketEntity } from '@models/entities/market.entity';
import { MarketRepository } from '@models/repositories/market.repository';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';

export class MarketService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private marketRepository: MarketRepository,
    ) {
        this.logger = this.loggerService.getLogger(MarketService.name);
        this.configService = configService;
    }

    public async paginate(options: IPaginationOptions): Promise<Pagination<MarketEntity>> {
        return paginate<MarketEntity>(this.marketRepository, options);
    }

    // public async create(data: MarketInput): Promise<MarketEntity> {
    // TODO: create market
    // const marketInfo = await this.marketRepository.
    // TODO: create criteria
    // TODO: create condition
    // }

    // public async update(data: Partial<MarketInput>): Promise<MarketEntity> {}
}
