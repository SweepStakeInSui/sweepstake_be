import { TradeRepository } from '@models/repositories/trade.repository';
import { Match } from '@modules/matching-engine/order-book';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { OrderStatus } from '../types/order';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { TradeStatus, TradeType } from '../types/trade';
import { UserRepository } from '@models/repositories/user.repository';
import { OutcomeType } from '@modules/market/types/outcome';

export class TradeService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly kafkaProducer: KafkaProducerService,
        private readonly transactionService: TransactionService,

        private readonly tradeRepository: TradeRepository,
        private readonly userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(TradeService.name);
        this.configService = configService;
    }

    public async executeTrade(matches: Match) {
        const order = matches.order;

        const trades = matches.matchedOrders.map(matchedOrder => {
            const trade = this.tradeRepository.create({
                makerOrderId: matchedOrder.order.id,
                takerOrderId: order.id,
                amount: matchedOrder.amount,
                price: matchedOrder.price,
                type: TradeType.Transfer,
                status: TradeStatus.Pending,
            });

            return trade;
        });

        await this.tradeRepository.manager.transaction(async manager => {
            console.log('trade executed');

            if (order.amount === order.fullfilled) {
                order.status = OrderStatus.Filled;
            }

            await manager.save(order);

            await Promise.all(trades.map(async trade => await manager.save(trade)));
        });

        const a = await Promise.all(
            matches.matchedOrders.map(async matchedOrder => {
                const makerAddress = (await this.userRepository.findOneBy({ id: matchedOrder.order.userId })).address;
                const takerAddress = (await this.userRepository.findOneBy({ id: order.userId })).address;

                let tradeType;
                let assetType;
                if (matchedOrder.order.outcome.type == order.outcome.type) {
                    tradeType = TradeType.Transfer;
                    assetType = order.outcome.type == OutcomeType.Yes ? true : false;
                } else {
                    tradeType = order.outcome.type == OutcomeType.Yes ? TradeType.Mint : TradeType.Merge;
                    assetType = true;
                }

                return {
                    marketId: matchedOrder.order.marketId,
                    tradeId: '',
                    maker: makerAddress,
                    makerAmount: matchedOrder.amount,
                    taker: takerAddress,
                    takeAmount: matchedOrder.amount,
                    tradeType,
                    assetType,
                };
            }),
        );

        const { bytes, signature } = await this.transactionService.signAdminTransaction(
            await this.transactionService.buildExecuteTradeTransaction(a),
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
    }
}
