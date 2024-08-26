import { OrderRepository } from '@models/repositories/order.repository';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { UserEntity } from '@models/entities/user.entity';
import { BadRequestException, Inject } from '@nestjs/common';
import { CreateOrderRequestDto } from '../dtos/create-order.dto';
import dayjs from 'dayjs';
import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { MarketRepository } from '@models/repositories/market.repository';
import { MatchingEngineService } from '@modules/matching-engine/services/matching-engine.service';

export class OrderService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        @Inject()
        private matchingEngineService: MatchingEngineService,

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
            price: BigInt(order.price),
            amount: BigInt(order.amount),
            timestamp: dayjs().unix(),
        });

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
            await manager.save(orderInfo);
            const balance = BigInt(userInfo.balance);
            const total = orderInfo.price * orderInfo.amount;
            if (balance < total) {
                throw new BadRequestException('Insufficient balance');
            }

            userInfo.balance = balance - total;
            await manager.save(userInfo);
        });

        // TODO: push into job
        this.matchingEngineService.addOrder(orderInfo);

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

        // push into job
        // await this.orderRepository.manager.transaction(async manager => {
        //     await manager.update(OrderEntity, orderId, { status: OrderStatus.Cancelled });
        //     userInfo.balance += orderInfo.price * orderInfo.amount;
        //     await manager.save(userInfo);
        // });
    }
}
