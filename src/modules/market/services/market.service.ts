import { MarketEntity } from '@models/entities/market.entity';
import { MarketRepository } from '@models/repositories/market.repository';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { MarketInput } from '../types/market';
import { FindOptionsWhere } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { ConditionRepository } from '@models/repositories/condition.repository';
import { CriteriaRepository } from '@models/repositories/criteria.repository';
import { OutcomeType } from '../types/outcome';
import { ConditionInput } from '../dtos/create-market.dto';
import { ConditionEntity } from '@models/entities/condition.entity';
import { CriteriaEntity } from '@models/entities/criteria.entity';

export class MarketService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private marketRepository: MarketRepository,
        private outcomeRepository: OutcomeRepository,
        private conditionRepository: ConditionRepository,
        private criteriaRepository: CriteriaRepository,
    ) {
        this.logger = this.loggerService.getLogger(MarketService.name);
        this.configService = configService;
    }

    public async paginate(options: IPaginationOptions): Promise<Pagination<MarketEntity>> {
        return paginate<MarketEntity>(this.marketRepository, options);
    }

    async find(condition: FindOptionsWhere<MarketEntity>) {
        try {
            const marketInfo = await this.marketRepository.findOneBy(condition);

            this.logger.info(marketInfo);
            return marketInfo;
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestException();
        }
    }

    public async create(market: MarketInput, conditions: ConditionInput[]): Promise<MarketEntity> {
        // TODO: create market
        const marketInfo = this.marketRepository.create(market);

        const outcomeYesInfo = this.outcomeRepository.create({
            type: OutcomeType.Yes,
        });

        const outcomeNoInfo = this.outcomeRepository.create({
            type: OutcomeType.No,
        });

        const conditionInfos: ConditionEntity[] = [];
        const criteriaInfos: CriteriaEntity[] = [];
        conditions.map(condition => {
            const criteriaInfo = this.criteriaRepository.create(condition.criteria);
            criteriaInfos.push(criteriaInfo);

            const conditionInfo = this.conditionRepository.create({
                value: condition.value,
                type: condition.type,
            });
            conditionInfos.push(conditionInfo);
        });

        this.marketRepository.manager.transaction(async manager => {
            await manager.save(marketInfo);

            outcomeYesInfo.marketId = marketInfo.id;
            outcomeNoInfo.marketId = marketInfo.id;

            await manager.save(outcomeYesInfo);
            await manager.save(outcomeNoInfo);

            await Promise.all(
                conditionInfos.map(async (conditionInfo, index) => {
                    const criteriaInfo = criteriaInfos[index];
                    await manager.save(criteriaInfo);

                    conditionInfo.marketId = marketInfo.id;
                    conditionInfo.criteriaId = criteriaInfo.id;

                    await manager.save(conditionInfo);
                }),
            );
        });

        return marketInfo;
    }
}
