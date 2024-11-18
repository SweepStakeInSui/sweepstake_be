import { MarketEntity } from '@models/entities/market.entity';
import { MarketRepository } from '@models/repositories/market.repository';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { ConditionRepository } from '@models/repositories/condition.repository';
import { CriteriaRepository } from '@models/repositories/criteria.repository';
import { CategoryRepository } from '@models/repositories/category.repository';
import { OutcomeType } from '../types/outcome';
import { CreateMarketRequestDto } from '../dtos/create-market.dto';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { UserEntity } from '@models/entities/user.entity';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { EEnvKey } from '@constants/env.constant';
import dayjs from 'dayjs';
import { MatchingEngineService } from '@modules/matching-engine/services/matching-engine.service';
import { OracleRepository } from '@models/repositories/oracle.repository';
import { OracleService } from '@modules/oracle/services/oracle.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrderSide } from '@modules/order/types/order';
import { ShareRepository } from '@models/repositories/share.repository';
import { ShareEntity } from '@models/entities/share.entity';
import { OrderRepository } from '@models/repositories/order.repository';

export class MarketService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        @InjectQueue('market') private readonly marketQueue: Queue,
        private kafkaProducer: KafkaProducerService,
        private transactionService: TransactionService,
        private matchingEngineService: MatchingEngineService,

        private oracleServices: OracleService,
        private marketRepository: MarketRepository,
        private outcomeRepository: OutcomeRepository,
        private conditionRepository: ConditionRepository,
        private criteriaRepository: CriteriaRepository,
        private categoryRepository: CategoryRepository,
        private oracleRepository: OracleRepository,
        private shareRepository: ShareRepository,
        private orderRepository: OrderRepository,
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

        return await paginate<MarketEntity>(queryBuilder, options);
    }

    public async popular(options: IPaginationOptions, categories?: string): Promise<Pagination<MarketEntity>> {
        const queryBuilder = this.marketRepository.createQueryBuilder('market');

        if (categories) {
            const categoryNames = categories.split(',').map(name => name.trim());
            categoryNames.forEach((category, index) => {
                queryBuilder.andWhere(`FIND_IN_SET(:category${index}, market.category)`, {
                    [`category${index}`]: category,
                });
            });
        }
        queryBuilder.orderBy('market.volume', 'DESC');

        return await paginate<MarketEntity>(queryBuilder, options);
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

    // public async create(
    //     userInfo: UserEntity,
    //     market: CreateMarketRequestDto,
    //     conditions: ConditionInput[],
    // ): Promise<MarketEntity> {
    //     const marketInfo = this.marketRepository.create(market);

    //     // TODO: take the create market fee
    //     // userInfo.reduceBalance(100n);

    //     const outcomeYesInfo = this.outcomeRepository.create({
    //         marketId: marketInfo.id,
    //         type: OutcomeType.Yes,
    //         askLiquidity: 0n,
    //         askPrice: 0n,
    //         bidLiquidity: 0n,
    //         bidPrice: 0n,
    //     });

    //     const outcomeNoInfo = this.outcomeRepository.create({
    //         marketId: marketInfo.id,
    //         type: OutcomeType.No,
    //         askLiquidity: 0n,
    //         askPrice: 0n,
    //         bidLiquidity: 0n,
    //         bidPrice: 0n,
    //     });

    //     const conditionInfos: ConditionEntity[] = [];
    //     const criteriaInfos: CriteriaEntity[] = [];
    //     conditions.map(condition => {
    //         const criteriaInfo = this.criteriaRepository.create(condition.criteria);
    //         criteriaInfos.push(criteriaInfo);

    //         const conditionInfo = this.conditionRepository.create({
    //             marketId: marketInfo.id,
    //             criteriaId: criteriaInfo.id,
    //             value: condition.value,
    //             type: condition.type,
    //         });
    //         conditionInfos.push(conditionInfo);
    //     });

    //     const infos = [userInfo, marketInfo, outcomeYesInfo, outcomeNoInfo, ...conditionInfos, ...criteriaInfos];

    //     await this.marketRepository.manager
    //         .transaction(async manager => {
    //             await Promise.all(
    //                 infos.map(async info => {
    //                     await manager.save(info);
    //                 }),
    //             );
    //         })
    //         .catch(err => {
    //             this.logger.error(err);
    //             throw new BadRequestException();
    //         });

    //     const msgMetaData = await this.kafkaProducer.produce({
    //         topic: KafkaTopic.SUBMIT_TRANSACTION,
    //         messages: [
    //             {
    //                 value: JSON.stringify(marketInfo),
    //             },
    //         ],
    //     });

    //     console.log(msgMetaData);

    //     return marketInfo;
    // }

    // TODO: remove this method
    public async create(userInfo: UserEntity, market: CreateMarketRequestDto): Promise<MarketEntity> {
        if (dayjs.unix(market.endTime).isBefore(dayjs().unix())) {
            throw new BadRequestException('Invalid end time');
        }
        const questionId = this.oracleServices.calculateQuestionId(market.description);
        const marketInfo = this.marketRepository.create({
            ...market,
            conditions: [],
            payoutTime: dayjs.unix(market.endTime).add(3, 'day').unix(),
            conditions_str: market.conditions,
            userId: userInfo.id,
        });

        const oracle = this.oracleRepository.create({
            marketId: marketInfo.id,
            questionId: questionId,
        });
        await this.oracleRepository.save(oracle);

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
        await this.marketQueue.add(
            'requestData',
            {
                creator: userInfo.address,
                marketId: marketInfo.id,
                description: marketInfo.description,
            },
            {
                delay: dayjs.unix(market.endTime).diff(dayjs().unix()),
            },
        );
        const { bytes, signature } = await this.transactionService.signAdminTransaction(
            await this.transactionService.buildCreateMarketTransaction(
                marketInfo.id,
                userInfo.address,
                marketInfo.name,
                marketInfo.description,
                marketInfo.conditions_str,
                marketInfo.startTime,
                marketInfo.endTime,
            ),
        );

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

    async getOrderBook(marketId: string) {
        const marketInfo = await this.marketRepository.findOneBy({ id: marketId });
        if (!marketInfo) {
            throw new BadRequestException('Market not found');
        }

        const book = await this.matchingEngineService.getOrderBook(marketInfo.id);

        const bookArray = Object.entries(book).map(([key, liquidity]) => {
            const [side, type, price] = key.split('-');

            return { side, type, price, liquidity };
        });

        const bidYes = bookArray
            .filter(item => item.type === OutcomeType.Yes && item.side === OrderSide.Bid)
            .filter(item => item.liquidity > 0)
            .sort((a, b) => {
                if (a.price < b.price) {
                    return 1;
                }
                if (a.price > b.price) {
                    return -1;
                }
                return 0;
            });

        const askYes = bookArray
            .filter(item => item.type === OutcomeType.Yes && item.side === OrderSide.Ask)
            .filter(item => item.liquidity > 0)
            .sort((a, b) => {
                if (a.price < b.price) {
                    return -1;
                }
                if (a.price > b.price) {
                    return 1;
                }
                return 0;
            });
        const bidNo = bookArray
            .filter(item => item.type === OutcomeType.No && item.side === OrderSide.Bid)
            .filter(item => item.liquidity > 0)
            .sort((a, b) => {
                if (a.price < b.price) {
                    return 1;
                }
                if (a.price > b.price) {
                    return -1;
                }
                return 0;
            });

        const askNo = bookArray
            .filter(item => item.type === OutcomeType.No && item.side === OrderSide.Ask)
            .filter(item => item.liquidity > 0)
            .sort((a, b) => {
                if (a.price < b.price) {
                    return -1;
                }
                if (a.price > b.price) {
                    return 1;
                }
                return 0;
            });
        return { bidYes, askYes, bidNo, askNo };
    }

    async getTopHolders(options: IPaginationOptions, marketId: string) {
        const outcomeInfos = await this.outcomeRepository.findBy({ marketId });

        return await Promise.all(
            outcomeInfos.map(async outcomeInfo => {
                const topHolders = await paginate<ShareEntity>(this.shareRepository, options, {
                    where: { outcomeId: outcomeInfo.id },
                    order: {
                        balance: 'desc',
                    },
                    relations: ['user'],
                });

                return {
                    outcome: outcomeInfo,
                    topHolders,
                };
            }),
        );
    }
}
