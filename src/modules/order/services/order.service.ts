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
import { OrderStatus } from '../types/order';
import { log } from 'console';
import { OrderEntity } from '@models/entities/order.entity';

export class OrderService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private kafkaProducer: KafkaProducerService,

        private orderRepository: OrderRepository,
        private outcomeRepository: OutcomeRepository,
        private marketRepository: MarketRepository,
    ) {
        this.logger = this.loggerService.getLogger(OrderService.name);
        this.configService = configService;
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
            await manager.save(orderInfo);
            // const balance = BigInt(userInfo.balance);
            // const total = orderInfo.price * orderInfo.amount;
            // if (balance < total) {
            //     throw new BadRequestException('Insufficient balance');
            // }

            // userInfo.balance = balance - total;
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

    public async consumeCancelMsg(orderId: OrderEntity) {
        console.log('consumeCancelMsg', orderId);
        // await this.orderRepository.manager.transaction(async manager => {
        //     await manager.update(OrderEntity, orderId, { status: OrderStatus.Cancelled });
        //     userInfo.balance += orderInfo.price * orderInfo.amount;
        //     await manager.save(userInfo);
        // });
    }
}
