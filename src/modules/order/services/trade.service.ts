import { TradeRepository } from '@models/repositories/trade.repository';
import { Match } from '@modules/matching-engine/order-book';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { OrderSide, OrderStatus } from '../types/order';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { TradeStatus, TradeType } from '../types/trade';
import { UserRepository } from '@models/repositories/user.repository';
import { OutcomeType } from '@modules/market/types/outcome';
import { MarketRepository } from '@models/repositories/market.repository';

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
        private readonly marketRepository: MarketRepository,
    ) {
        this.logger = this.loggerService.getLogger(TradeService.name);
        this.configService = configService;
    }

    public async executeTrade(matches: Match) {
        const order = matches.order;

        const trades = [];

        await this.tradeRepository.manager.transaction(async manager => {
            console.log('trade executed');

            await Promise.all(
                matches.matchedOrders.map(async matchedOrder => {
                    let tradeType;
                    let assetType;
                    if (matchedOrder.order.outcome.type == order.outcome.type) {
                        tradeType = TradeType.Transfer;
                        assetType = order.outcome.type == OutcomeType.Yes ? true : false;
                    } else {
                        tradeType = order.side == OrderSide.Bid ? TradeType.Mint : TradeType.Merge;
                        assetType = true;
                    }

                    const trade = this.tradeRepository.create({
                        makerOrderId: matchedOrder.order.id,
                        takerOrderId: order.id,
                        amount: matchedOrder.amount,
                        price: matchedOrder.price,
                        type: tradeType,
                        status: TradeStatus.Pending,
                    });

                    await manager.save(trade);

                    if (matchedOrder.order.amount === matchedOrder.order.fullfilled) {
                        matchedOrder.order.status = OrderStatus.Filled;
                    }
                    await manager.save(matchedOrder.order);

                    if (order.amount === order.fullfilled) {
                        order.status = OrderStatus.Filled;
                    }
                    await manager.save(order);

                    const maker = await this.userRepository.findOneBy({ id: matchedOrder.order.userId });

                    const makerAddress = maker.address;
                    const taker = await this.userRepository.findOneBy({ id: order.userId });
                    const takerAddress = taker.address;

                    const marketInfo = await this.marketRepository.findOneBy({ id: matchedOrder.order.marketId });

                    marketInfo.volume += matchedOrder.amount * matchedOrder.price;
                    marketInfo.tradeCount += 1n;

                    await manager.save(marketInfo);

                    maker.volume += matchedOrder.amount * matchedOrder.price;
                    taker.volume += matchedOrder.amount * matchedOrder.price;

                    const msgMetaDataAnalytic = await this.kafkaProducer.produce({
                        topic: KafkaTopic.ANALYSE_TRADE,
                        messages: [
                            {
                                value: JSON.stringify({
                                    userId: maker.id,
                                    amount: matchedOrder.amount * matchedOrder.price,
                                }),
                            },
                            {
                                value: JSON.stringify({
                                    userId: taker.id,
                                    amount: matchedOrder.amount * matchedOrder.price,
                                }),
                            },
                        ],
                    });

                    console.log(msgMetaDataAnalytic);

                    await manager.save([maker, taker]);

                    // TODO: improve this stupid switch case to generate trade transaction data
                    switch (tradeType) {
                        case TradeType.Transfer:
                            if (order.side == OrderSide.Bid) {
                                trades.push({
                                    marketId: marketInfo.onchainId,
                                    tradeId: trade.id,
                                    makerOrderId: order.id,
                                    maker: takerAddress,
                                    makerAmount: matchedOrder.amount,
                                    takerOrderId: matchedOrder.order.id,
                                    taker: makerAddress,
                                    takeAmount: matchedOrder.amount,
                                    tradeType,
                                    assetType,
                                });
                            } else {
                                trades.push({
                                    marketId: marketInfo.onchainId,
                                    tradeId: trade.id,
                                    makerOrderId: matchedOrder.order.id,
                                    maker: makerAddress,
                                    makerAmount: matchedOrder.amount,
                                    takerOrderId: order.id,
                                    taker: takerAddress,
                                    takeAmount: matchedOrder.amount,
                                    tradeType,
                                    assetType,
                                });
                            }

                            break;
                        case TradeType.Mint:
                        case TradeType.Merge:
                            if (order.outcome.type == OutcomeType.Yes) {
                                trades.push({
                                    marketId: marketInfo.onchainId,
                                    tradeId: trade.id,
                                    makerOrderId: order.id,
                                    maker: takerAddress,
                                    makerAmount: matchedOrder.amount,
                                    takerOrderId: matchedOrder.order.id,
                                    taker: makerAddress,
                                    takeAmount: matchedOrder.amount,
                                    tradeType,
                                    assetType,
                                });
                            } else {
                                trades.push({
                                    marketId: marketInfo.onchainId,
                                    tradeId: trade.id,
                                    makerOrderId: matchedOrder.order.id,
                                    maker: makerAddress,
                                    makerAmount: matchedOrder.amount,
                                    takerOrderId: order.id,
                                    taker: takerAddress,
                                    takeAmount: matchedOrder.amount,
                                    tradeType,
                                    assetType,
                                });
                            }
                            break;
                    }
                }),
            );
        });

        const { bytes, signature } = await this.transactionService.signAdminTransaction(
            await this.transactionService.buildExecuteTradeTransaction(trades),
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
