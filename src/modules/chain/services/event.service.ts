import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { CrawlerService } from './crawler.service';
import { SuiEvent } from '@mysten/sui/dist/cjs/client';
import { EEnvKey } from '@constants/env.constant';
import { MarketRepository } from '@models/repositories/market.repository';
import { UserRepository } from '@models/repositories/user.repository';
import { ShareRepository } from '@models/repositories/share.repository';
import { OrderRepository } from '@models/repositories/order.repository';
import { TradeRepository } from '@models/repositories/trade.repository';
import { NotificationType } from '@modules/notification/types/notification';
import { BalanceChangeRepository } from '@models/repositories/balance-change.repository';
import dayjs from 'dayjs';
import { BalanceChangeStatus, BalanceChangeType } from '@modules/user/types/balance-change.type';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { OracleRepository } from '@models/repositories/oracle.repository';
import { OutcomeType } from '@modules/market/types/outcome';
import { OutcomeRepository } from '@models/repositories/outcome.repository';

@Injectable()
export class EventService {
    protected logger: Logger;
    protected configService: ConfigService;

    private sweepstakeContract: string;
    private conditionalMarketContract: string;
    private unit: bigint;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private kafkaProducer: KafkaProducerService,
        private readonly marketRepository: MarketRepository,
        private readonly userRepository: UserRepository,
        private readonly shareRepository: ShareRepository,
        private readonly orderRepository: OrderRepository,
        private readonly tradeRepository: TradeRepository,
        private readonly balanceChangeRepository: BalanceChangeRepository,
        private readonly oracleRepository: OracleRepository,
        private readonly outcomeRepository: OutcomeRepository,
    ) {
        this.logger = this.loggerService.getLogger(CrawlerService.name);
        this.configService = configService;

        this.sweepstakeContract = this.configService.get(EEnvKey.SWEEPSTAKE_CONTRACT);
        this.conditionalMarketContract = this.configService.get(EEnvKey.CONDITIONAL_MARKET_CONTRACT);
        this.unit = 10n ** BigInt(this.configService.get(EEnvKey.DECIMALS));
    }

    public async proccessEvent(events: SuiEvent[]) {
        for (const event of events) {
            console.log('Event proccessed: ', event);
            console.log(`${this.sweepstakeContract}::sweepstake::DepositEvent`);

            switch (event.type) {
                case `${this.sweepstakeContract}::sweepstake::DepositEvent`: {
                    await this.processDepositEvent(event);
                    break;
                }
                case `${this.sweepstakeContract}::sweepstake::WithdrawEvent`: {
                    await this.processWithdrawEvent(event);
                    break;
                }
                case `${this.conditionalMarketContract}::conditional_market::NewMarketEvent`: {
                    await this.proccessNewMarketEvent(event);
                    break;
                }
                case `${this.conditionalMarketContract}::conditional_market::MintYesEvent`: {
                    await this.proccessMintYesEvent(event);
                    break;
                }
                case `${this.conditionalMarketContract}::conditional_market::MintNoEvent`: {
                    await this.proccessMintNoEvent(event);
                    break;
                }
                case `${this.conditionalMarketContract}::conditional_market::TransferEvent`: {
                    await this.proccessTransferEvent(event);
                    break;
                }
                case `${this.conditionalMarketContract}::conditional_market::MergeEvent`: {
                    await this.proccessMergeEvent(event);
                    break;
                }
                case `${this.conditionalMarketContract}::conditional_market::ClaimEvent`: {
                    await this.proccessClaimEvent(event);
                }
            }
        }
    }

    private async processDepositEvent(event: SuiEvent) {
        const { owner, amount } = event.parsedJson as any;
        const userInfo = await this.userRepository.findOneBy({
            address: owner,
        });

        if (userInfo) {
            userInfo.addBalance(BigInt(amount));

            const depositInfo = await this.balanceChangeRepository.create({
                userId: userInfo.id,
                amount,
                from: event.sender,
                type: BalanceChangeType.Deposit,
                status: BalanceChangeStatus.Success,
                timestamp: event.timestampMs ? dayjs(event.timestampMs).unix() : dayjs().unix(),
                transactionHash: event.id.txDigest,
            });
            await this.userRepository.manager.transaction(async manager => {
                await manager.save(userInfo);
                await manager.save(depositInfo);
            });
        } else {
            this.logger.error('User not found');
        }

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.CREATE_NOTIFICATION,
            messages: [
                {
                    value: JSON.stringify({
                        notifications: [
                            {
                                userId: userInfo.id,
                                type: NotificationType.Deposited,
                                message: `You have deposited ${amount} to your account`,
                                data: {
                                    amount,
                                },
                            },
                        ],
                    }),
                },
            ],
        });

        console.log(msgMetaData);
    }

    private async processWithdrawEvent(event: SuiEvent) {
        const { withdraw_id: withdrawId, amount } = event.parsedJson as any;

        const withdrawInfo = await this.balanceChangeRepository.findOneBy({
            id: withdrawId,
        });

        if (!withdrawInfo) {
            this.logger.error('Withdraw info not found');
            return;
        }

        withdrawInfo.status = BalanceChangeStatus.Success;
        withdrawInfo.transactionHash = event.id.txDigest;

        await this.balanceChangeRepository.save(withdrawInfo);

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.CREATE_NOTIFICATION,
            messages: [
                {
                    value: JSON.stringify({
                        notifications: [
                            {
                                userId: withdrawInfo.userId,
                                type: NotificationType.Withdrawn,
                                message: `You have withdrown ${amount} to your account`,
                                data: {
                                    amount,
                                },
                            },
                        ],
                    }),
                },
            ],
        });

        console.log(msgMetaData);
    }

    private async proccessNewMarketEvent(event: SuiEvent) {
        console.log('events', event.parsedJson);

        const marketInfo = await this.marketRepository.findOneBy({
            id: (event.parsedJson as any).market_id,
        });

        if (marketInfo) {
            marketInfo.isActive = true;
            marketInfo.onchainId = (event.parsedJson as any).object_id;
            marketInfo.transactionHash = event.id.txDigest;
        }

        await this.marketRepository.save(marketInfo);

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.CREATE_NOTIFICATION,
            messages: [
                {
                    value: JSON.stringify({
                        notifications: [
                            {
                                userId: marketInfo.userId,
                                type: NotificationType.MarketCreated,
                                message: `Your market ${marketInfo.name} has been created`,
                                data: {
                                    marketInfo,
                                },
                            },
                        ],
                    }),
                },
            ],
        });

        console.log(msgMetaData);
    }

    private async proccessMintYesEvent(event: SuiEvent) {
        console.log(event.parsedJson);

        const { amount_yes: amount, order_id: orderId } = event.parsedJson as any;

        const orderInfo = await this.orderRepository.findOneBy({
            id: orderId,
        });

        let shareInfo = await this.shareRepository.findOneBy({
            outcomeId: orderInfo.outcomeId,
            userId: orderInfo.userId,
        });

        if (shareInfo) {
            shareInfo.addBalance(BigInt(amount));
        } else {
            shareInfo = this.shareRepository.create({
                userId: orderInfo.userId,
                outcomeId: orderInfo.outcomeId,
                balance: BigInt(amount),
            });
        }

        await this.shareRepository.save(shareInfo);

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.CREATE_NOTIFICATION,
            messages: [
                {
                    value: JSON.stringify({
                        notifications: [
                            {
                                userId: orderInfo.userId,
                                type: NotificationType.OrderExecuted,
                                message: `You have minted ${amount} to your account`,
                                data: {
                                    amount,
                                    outcomeId: orderInfo.outcomeId,
                                    orderId,
                                },
                            },
                        ],
                    }),
                },
            ],
        });

        console.log(msgMetaData);
    }

    private async proccessMintNoEvent(event: SuiEvent) {
        console.log(event.parsedJson);

        const { amount_no: amount, order_id: orderId } = event.parsedJson as any;

        const orderInfo = await this.orderRepository.findOneBy({
            id: orderId,
        });

        let shareInfo = await this.shareRepository.findOneBy({
            outcomeId: orderInfo.outcomeId,
            userId: orderInfo.userId,
        });

        if (shareInfo) {
            shareInfo.addBalance(BigInt(amount));
        } else {
            shareInfo = this.shareRepository.create({
                userId: orderInfo.userId,
                outcomeId: orderInfo.outcomeId,
                balance: BigInt(amount),
            });
        }

        await this.shareRepository.save(shareInfo);

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.CREATE_NOTIFICATION,
            messages: [
                {
                    value: JSON.stringify({
                        notifications: [
                            {
                                userId: orderInfo.userId,
                                type: NotificationType.OrderExecuted,
                                message: `You have minted ${amount} to your account`,
                                data: {
                                    amount,
                                    outcomeId: orderInfo.outcomeId,
                                    orderId,
                                },
                            },
                        ],
                    }),
                },
            ],
        });

        console.log(msgMetaData);
    }

    private async proccessMergeEvent(event: SuiEvent) {
        console.log(event.parsedJson);

        const {
            order_id_yes: orderYesId,
            order_id_no: orderNoId,
            amount_yes: amountYes,
            amount_no: amountNo,
        } = event.parsedJson as any;

        const [orderYesInfo, orderNoInfo] = await Promise.all([
            this.orderRepository.findOneBy({
                id: orderYesId,
            }),
            this.orderRepository.findOneBy({
                id: orderNoId,
            }),
        ]);

        const [userYes, userNo] = await Promise.all([
            this.userRepository.findOneBy({
                id: orderYesInfo.userId,
            }),
            this.shareRepository.findOneBy({
                id: orderNoInfo.userId,
            }),
        ]);
        console.log(userYes, userNo);

        // TODO: improve adding balance to userYes and userNo
        const [userYesInfo, userNoInfo] = await Promise.all([
            this.userRepository.findOneBy({ id: orderYesInfo.userId }),
            this.userRepository.findOneBy({ id: orderNoInfo.userId }),
        ]);

        // TODO: check if this is correct
        userYesInfo.addBalance(BigInt(amountYes) * orderYesInfo.price);
        userNoInfo.addBalance(BigInt(amountNo) * orderNoInfo.price);

        await this.userRepository.manager.transaction(async manager => {
            await manager.save(userYesInfo);
            await manager.save(userNoInfo);
        });

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.CREATE_NOTIFICATION,
            messages: [
                {
                    value: JSON.stringify({
                        notifications: [
                            {
                                userId: orderNoInfo.userId,
                                type: NotificationType.OrderExecuted,
                                message: `You have burned ${amountNo} from your account`,
                                data: {
                                    amount: amountNo,
                                    outcomeId: orderNoInfo.outcomeId,
                                    orderId: orderNoId,
                                },
                            },
                            {
                                userId: orderYesInfo.userId,
                                type: NotificationType.OrderExecuted,
                                message: `You have burned ${amountYes} from your account`,
                                data: {
                                    amount: amountYes,
                                    type: orderYesInfo.outcomeId,
                                    orderId: orderYesId,
                                },
                            },
                        ],
                    }),
                },
            ],
        });

        console.log(msgMetaData);
    }

    private async proccessTransferEvent(event: SuiEvent) {
        console.log(event.parsedJson);

        const { maker_order_id: makerOrderId, taker_order_id: takerOrderId, amount } = event.parsedJson as any;

        const [makerOrderInfo, takerOrderInfo] = await Promise.all([
            this.orderRepository.findOneBy({
                id: makerOrderId,
            }),
            this.orderRepository.findOneBy({
                id: takerOrderId,
            }),
        ]);

        await this.shareRepository.manager.transaction(async manager => {
            const makerUserInfo = await this.userRepository.findOneBy({
                id: makerOrderInfo.userId,
            });

            // TODO: check if this is correct
            makerUserInfo.addBalance(amount * makerOrderInfo.price);

            const takerShareInfo = await this.shareRepository.findOneBy({
                userId: takerOrderInfo.userId,
                outcomeId: takerOrderInfo.outcomeId,
            });

            takerShareInfo.addBalance(BigInt(amount));

            await manager.save(makerUserInfo);
            await manager.save(takerShareInfo);
        });

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.CREATE_NOTIFICATION,
            messages: [
                {
                    value: JSON.stringify({
                        notifications: [
                            {
                                userId: makerOrderInfo.userId,
                                type: NotificationType.OrderExecuted,
                                message: `You have transferred ${amount} from your account`,
                                data: {
                                    amount: amount,
                                    type: 'send',
                                    orderId: makerOrderId,
                                },
                            },
                            {
                                userId: takerOrderInfo.userId,
                                type: NotificationType.OrderExecuted,
                                message: `You have received ${amount} from your account`,
                                data: {
                                    amount: amount,
                                    type: 'receive',
                                    orderId: takerOrderId,
                                },
                            },
                        ],
                    }),
                },
            ],
        });

        console.log(msgMetaData);
    }

    private async proccessClaimEvent(event: SuiEvent) {
        const { market_id: marketId } = event.parsedJson as any;

        const marketInfo = await this.marketRepository.findOneBy({
            id: marketId,
        });
        const oracleInfo = await this.oracleRepository.findOneBy({
            marketId,
        });

        if (!marketInfo || !oracleInfo) {
            throw new BadRequestException('Market not found');
        }

        const result = oracleInfo.winner ? OutcomeType.Yes : OutcomeType.No;
        const outcomeReward = await this.outcomeRepository.findOneBy({ marketId: marketId, type: result });
        if (!outcomeReward) {
            throw new BadRequestException('Outcome reward not found');
        }

        const usersRewarded = await this.shareRepository.find({
            where: { outcomeId: outcomeReward.id },
            relations: ['user'],
        });

        await Promise.all(
            usersRewarded.map(async holder => {
                const newBalance = holder.user.balance + holder.balance * this.unit;
                await this.userRepository.update(holder.user.id, {
                    balance: newBalance,
                });

                const msgMetaData = await this.kafkaProducer.produce({
                    topic: KafkaTopic.CREATE_NOTIFICATION,
                    messages: [
                        {
                            value: JSON.stringify({
                                notifications: [
                                    {
                                        userId: holder.user.id,
                                        type: NotificationType.ClaimedReward,
                                        message: `You have received ${holder.balance} as reward from market ${marketInfo.name}`,
                                        data: {
                                            amount: holder.balance,
                                        },
                                    },
                                ],
                            }),
                        },
                    ],
                });
                console.log(msgMetaData);
            }),
        );
        const loseResult = oracleInfo.winner ? OutcomeType.No : OutcomeType.Yes;
        const loseOutcome = await this.outcomeRepository.findOneBy({ marketId: marketId, type: loseResult });
        if (!loseOutcome) {
            throw new BadRequestException('Lose outcome not found');
        }

        const usersLost = await this.shareRepository.find({
            where: { outcomeId: loseOutcome.id },
            relations: ['user'],
        });

        await Promise.all(
            usersLost.map(async holder => {
                const msgMetaData = await this.kafkaProducer.produce({
                    topic: KafkaTopic.CREATE_NOTIFICATION,
                    messages: [
                        {
                            value: JSON.stringify({
                                notifications: [
                                    {
                                        userId: holder.user.id,
                                        type: NotificationType.ClaimedReward,
                                        message: `You have lost ${holder.balance} from market ${marketInfo.name}`,
                                        data: {
                                            amount: holder.balance,
                                        },
                                    },
                                ],
                            }),
                        },
                    ],
                });
                console.log(msgMetaData);
            }),
        );
    }
}
