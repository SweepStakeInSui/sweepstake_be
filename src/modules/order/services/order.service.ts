import { OrderRepository } from '@models/repositories/order.repository';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { UserEntity } from '@models/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { CreateOrderRequestDto } from '../dtos/create-order.dto';
import dayjs from 'dayjs';
import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { MarketRepository } from '@models/repositories/market.repository';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { OrderSide, OrderStatus, OrderType } from '../types/order';
import { log } from 'console';
import { ShareRepository } from '@models/repositories/share.repository';
import { OutcomeType } from '@modules/market/types/outcome';
import { BigIntUtil } from '@shared/utils/bigint';
import { OrderEntity } from '@models/entities/order.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { EEnvKey } from '@constants/env.constant';
import { FindOptionsWhere } from 'typeorm';

export class OrderService {
    protected logger: Logger;
    protected configService: ConfigService;

    private readonly unit: bigint;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private kafkaProducer: KafkaProducerService,

        private readonly orderRepository: OrderRepository,
        private readonly outcomeRepository: OutcomeRepository,
        private readonly marketRepository: MarketRepository,
        private readonly shareRepository: ShareRepository,
    ) {
        this.logger = this.loggerService.getLogger(OrderService.name);
        this.configService = configService;
        this.unit = 10n ** BigInt(this.configService.get(EEnvKey.DECIMALS));
    }

    // check balance
    // create order
    // const order = this.orderRepository.create({});
    // create transaction
    // deduct balance
    // save order
    // save transaction
    public async createOrder(userInfo: UserEntity, order: CreateOrderRequestDto) {
        const orderInfo = this.orderRepository.create({
            userId: userInfo.id,
            ...order,
            timestamp: dayjs().unix(),
        });

        console.log('orderInfo', orderInfo);

        const outcomeInfo = await this.outcomeRepository.findOne({
            where: {
                id: orderInfo.outcomeId,
            },
            relations: ['market'],
        });

        if (!outcomeInfo) {
            throw new BadRequestException('Outcome not found');
        }

        const marketInfo = outcomeInfo.market;

        const oppositeOutcomeInfo = await this.outcomeRepository.findOne({
            where: {
                marketId: marketInfo.id,
                type: outcomeInfo.type === OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes,
            },
        });

        if (
            !marketInfo ||
            !marketInfo.isActive ||
            marketInfo.startTime > orderInfo.timestamp ||
            marketInfo.endTime < orderInfo.timestamp
        ) {
            throw new BadRequestException('market not available');
        }

        await this.orderRepository.manager.transaction(async manager => {
            orderInfo.marketId = marketInfo.id;
            orderInfo.outcome = outcomeInfo;

            switch (orderInfo.type) {
                case OrderType.FOK:
                    switch (orderInfo.side) {
                        case OrderSide.Bid: {
                            const sameAssetPrice = outcomeInfo.askPrice;
                            const oppositeAssetPrice = oppositeOutcomeInfo.bidPrice;

                            orderInfo.price = BigIntUtil.max(oppositeAssetPrice, this.unit - sameAssetPrice);
                            break;
                        }
                        case OrderSide.Ask: {
                            const sameAssetPrice = outcomeInfo.askPrice;
                            const oppositeAssetPrice = oppositeOutcomeInfo.bidPrice;

                            orderInfo.price = BigIntUtil.min(oppositeAssetPrice, this.unit - sameAssetPrice);
                            break;
                        }
                    }
                    break;
                case OrderType.GTC:
                case OrderType.GTD:
                    orderInfo.slippage = 0n;
                    break;
            }

            switch (orderInfo.side) {
                case OrderSide.Bid: {
                    userInfo.reduceBalance(
                        (orderInfo.price * (this.unit + orderInfo.slippage) * orderInfo.amount) / this.unit,
                    );
                    break;
                }
                case OrderSide.Ask: {
                    const shareInfo = await this.shareRepository.findOneBy({
                        outcomeId: orderInfo.outcomeId,
                        userId: userInfo.id,
                    });
                    if (!shareInfo) {
                        throw new BadRequestException('Insufficient balance');
                    }

                    shareInfo.reduceBalance(orderInfo.amount);
                    await manager.save(shareInfo);
                    break;
                }
            }

            await manager.save(orderInfo);
            await manager.save(userInfo);
        });

        const msgMetadata = await this.kafkaProducer.produce({
            topic: KafkaTopic.MATCH_ORDER,
            messages: [
                {
                    key: orderInfo.id,
                    value: JSON.stringify(orderInfo),
                },
            ],
        });

        log(msgMetadata);

        return orderInfo;
    }

    public async cancelOrder(userInfo: UserEntity, orderId: string) {
        const orderInfo = await this.orderRepository.findOne({
            where: {
                id: orderId,
            },
        });
        if (!orderInfo) {
            throw new BadRequestException('Order not found');
        }
        if (orderInfo.userId !== userInfo.id) {
            throw new BadRequestException('Order not found');
        }

        if (orderInfo.status !== OrderStatus.Pending) {
            throw new BadRequestException('cannot cancel order');
        }

        const msgMetadata = await this.kafkaProducer.produce({
            topic: KafkaTopic.CANCEL_ORDER,
            messages: [
                {
                    key: orderInfo.id,
                    value: JSON.stringify(orderInfo),
                },
            ],
        });

        log(msgMetadata);
    }

    public async paginate(
        options: IPaginationOptions,
        where: FindOptionsWhere<OrderEntity>,
    ): Promise<Pagination<OrderEntity>> {
        return paginate<OrderEntity>(this.orderRepository, options, {
            where,
            order: {
                timestamp: 'desc',
            },
            relations: {
                outcome: {
                    market: true,
                },
                user: true,
            },
        });
    }
}
