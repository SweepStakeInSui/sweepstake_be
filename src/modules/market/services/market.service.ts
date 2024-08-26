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
        return paginate<MarketEntity>(this.marketRepository, options, {
            relations: ['outcomes'],
        });
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
        const marketInfo = this.marketRepository.create(market);

        const outcomeYesInfo = this.outcomeRepository.create({
            marketId: marketInfo.id,
            type: OutcomeType.Yes,
        });

        const outcomeNoInfo = this.outcomeRepository.create({
            marketId: marketInfo.id,
            type: OutcomeType.No,
        });

        const conditionInfos: ConditionEntity[] = [];
        const criteriaInfos: CriteriaEntity[] = [];
        conditions.map(condition => {
            const criteriaInfo = this.criteriaRepository.create(condition.criteria);
            criteriaInfos.push(criteriaInfo);

            const conditionInfo = this.conditionRepository.create({
                marketId: marketInfo.id,
                criteriaId: criteriaInfo.id,
                value: condition.value,
                type: condition.type,
            });
            conditionInfos.push(conditionInfo);
        });

        const infos = [marketInfo, outcomeYesInfo, outcomeNoInfo, ...conditionInfos, ...criteriaInfos];

        await this.marketRepository.manager
            .transaction(async manager => {
                await Promise.all(
                    infos.map(async info => {
                        await manager.save(info);
                    }),
                );
            })
            .catch(err => {
                this.logger.error(err);
                throw new BadRequestException();
            });

        // TODO: create signature and return to user to send to onchain contract
        return marketInfo;
    }
}
