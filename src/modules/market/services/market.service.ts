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
import { CategoryRepository } from '@models/repositories/category.repository';
import { OutcomeType } from '../types/outcome';
import { ConditionInput } from '../dtos/create-market.dto';
import { ConditionEntity } from '@models/entities/condition.entity';
import { CriteriaEntity } from '@models/entities/criteria.entity';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { UserEntity } from '@models/entities/user.entity';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { EEnvKey } from '@constants/env.constant';

export class MarketService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private kafkaProducer: KafkaProducerService,
        private transactionService: TransactionService,
        private marketRepository: MarketRepository,
        private outcomeRepository: OutcomeRepository,
        private conditionRepository: ConditionRepository,
        private criteriaRepository: CriteriaRepository,
        private categoryRepository: CategoryRepository,
    ) {
        this.logger = this.loggerService.getLogger(MarketService.name);
        this.configService = configService;
    }

    // TODO: Improve filter of this method
    public async paginate(
        options: IPaginationOptions,
        filters: { name?: string; categories?: string; userId?: string },
    ): Promise<Pagination<MarketEntity>> {
        const queryBuilder = this.marketRepository.createQueryBuilder('market');

        if (filters.name) {
            queryBuilder.andWhere('market.name LIKE :name', { name: `%${filters.name}%` });
        }

        if (filters.categories) {
            const categoryNames = filters.categories.split(',').map(name => name.trim());
            categoryNames.forEach((category, index) => {
                queryBuilder.andWhere(`FIND_IN_SET(:category${index}, market.category)`, {
                    [`category${index}`]: category,
                });
            });
        }

        if (filters.userId) {
            queryBuilder.andWhere('market.userId = :userId', { userId: filters.userId });
        }

        return paginate<MarketEntity>(queryBuilder, options);
    }

    async search(name: string) {
        return await this.marketRepository
            .createQueryBuilder()
            .select()
            .where(`MATCH(name) AGAINST ('${name}' IN NATURAL LANGUAGE MODE)`)
            .getMany();
    }

    async find(condition: FindOptionsWhere<MarketEntity>) {
        try {
            const marketInfo = await this.marketRepository.findOne({
                where: condition,
                relations: ['outcomes'],
            });

            this.logger.info(marketInfo);
            return marketInfo;
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestException();
        }
    }

    public async create(
        userInfo: UserEntity,
        market: MarketInput,
        conditions: ConditionInput[],
    ): Promise<MarketEntity> {
        const marketInfo = this.marketRepository.create(market);

        // TODO: take the create market fee
        // userInfo.reduceBalance(100n);

        const outcomeYesInfo = this.outcomeRepository.create({
            marketId: marketInfo.id,
            type: OutcomeType.Yes,
            askLiquidity: 0n,
            askPrice: 0n,
            bidLiquidity: 0n,
            bidPrice: 0n,
        });

        const outcomeNoInfo = this.outcomeRepository.create({
            marketId: marketInfo.id,
            type: OutcomeType.No,
            askLiquidity: 0n,
            askPrice: 0n,
            bidLiquidity: 0n,
            bidPrice: 0n,
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

        const infos = [userInfo, marketInfo, outcomeYesInfo, outcomeNoInfo, ...conditionInfos, ...criteriaInfos];

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

        // TODO: push job create market transaction
        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.SUBMIT_TRANSACTION,
            messages: [
                {
                    value: JSON.stringify(marketInfo),
                },
            ],
        });

        console.log(msgMetaData);

        return marketInfo;
    }

    // TODO: remove this method
    public async create2(userInfo: UserEntity, market: MarketInput, conditions: string): Promise<MarketEntity> {
        const marketInfo = this.marketRepository.create({ ...market, conditions_str: conditions, userId: userInfo.id });

        userInfo.reduceBalance(BigInt(this.configService.get(EEnvKey.FEE_CREATE_MARKET)));

        const outcomeYesInfo = this.outcomeRepository.create({
            marketId: marketInfo.id,
            type: OutcomeType.Yes,
            askLiquidity: 0n,
            askPrice: 0n,
            bidLiquidity: 0n,
            bidPrice: 0n,
        });

        const outcomeNoInfo = this.outcomeRepository.create({
            marketId: marketInfo.id,
            type: OutcomeType.No,
            askLiquidity: 0n,
            askPrice: 0n,
            bidLiquidity: 0n,
            bidPrice: 0n,
        });

        const infos = [userInfo, marketInfo, outcomeYesInfo, outcomeNoInfo];

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

        const { bytes, signature } = await this.transactionService.signAdminTransaction(
            await this.transactionService.buildCreateMarketTransaction(
                marketInfo.id,
                '0x4a3d4c6c35118693cbef1b2782995194eaa5dd98bfd21f6bbfff86dfc65fafb3',
                marketInfo.name,
                marketInfo.description,
                marketInfo.conditions_str,
                marketInfo.startTime,
                marketInfo.endTime,
            ),
        );

        // TODO: push job create market transaction
        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.SUBMIT_TRANSACTION,
            messages: [
                {
                    value: JSON.stringify({ txData: bytes, signature: signature }),
                },
            ],
        });

        console.log(msgMetaData);

        return marketInfo;
    }
}
