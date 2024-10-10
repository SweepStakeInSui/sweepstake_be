import { Injectable } from '@nestjs/common';
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
import { NotificationRepository } from '@models/repositories/notification.repository';

@Injectable()
export class EventService {
    protected logger: Logger;
    protected configService: ConfigService;

    private sweepstakeContract: string;
    private conditionalMarketContract: string;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly marketRepository: MarketRepository,
        private readonly userRepository: UserRepository,
        private readonly shareRepository: ShareRepository,
        private readonly orderRepository: OrderRepository,
        private readonly tradeRepository: TradeRepository,
        private readonly notificationRepository: NotificationRepository,
    ) {
        this.logger = this.loggerService.getLogger(CrawlerService.name);
        this.configService = configService;

        this.sweepstakeContract = this.configService.get(EEnvKey.SWEEPSTAKE_CONTRACT);
        this.conditionalMarketContract = this.configService.get(EEnvKey.CONDITIONAL_MARKET_CONTRACT);
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

            await this.userRepository.save(userInfo);
        } else {
            this.logger.error('User not found');
        }

        const notificationInfo = await this.notificationRepository.create({
            userId: userInfo.id,
            type: 'deposit',
            message: `You have deposited ${amount} to your account`,
        });

        await this.notificationRepository.save(notificationInfo);
    }

    private async processWithdrawEvent(event: SuiEvent) {
        const { owner, amount } = event.parsedJson as any;
        const notificationInfo = await this.notificationRepository.create({
            userId: owner,
            type: 'withdraw',
            message: `You have withdrown ${amount} to your account`,
        });

        await this.notificationRepository.save(notificationInfo);
    }

    private async proccessNewMarketEvent(event: SuiEvent) {
        console.log(event.parsedJson);

        const marketInfo = await this.marketRepository.findOneBy({
            id: (event.parsedJson as any).id,
        });

        if (marketInfo) {
            marketInfo.isActive = true;
            marketInfo.onchainId = (event.parsedJson as any).object_id;
        }

        await this.marketRepository.save(marketInfo);

        const notificationInfo = await this.notificationRepository.create({
            userId: marketInfo.userId,
            type: 'create_market',
            message: `Your market ${marketInfo.name} has been created`,
        });

        await this.notificationRepository.save(notificationInfo);
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

        const notificationInfo = await this.notificationRepository.create({
            userId: orderInfo.userId,
            type: 'order_executed',
            message: `You have minted ${amount} to your account`,
        });

        await this.notificationRepository.save(notificationInfo);
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

        const notificationInfo = await this.notificationRepository.create({
            userId: orderInfo.userId,
            type: 'order_executed',
            message: `You have minted ${amount} to your account`,
        });

        await this.notificationRepository.save(notificationInfo);
    }

    private async proccessMergeEvent(event: SuiEvent) {
        console.log(event.parsedJson);

        const {
            order_id_yes: orderYesId,
            order_id_no: orderNoId,
            // amount_yes: amountYes,
            // amount_no: amountNo,
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
        userYesInfo.addBalance(orderYesInfo.amount * orderYesInfo.price);
        userNoInfo.addBalance(orderNoInfo.amount * orderNoInfo.price);

        await this.userRepository.manager.transaction(async manager => {
            await manager.save(userYesInfo);
            await manager.save(userNoInfo);
        });

        const notificationInfos = await this.notificationRepository.create([
            {
                userId: orderNoId.userId,
                type: 'order_executed',
                message: `You have burned ${orderNoInfo.amount} from your account`,
            },
            {
                userId: orderYesId.userId,
                type: 'order_executed',
                message: `You have burned ${orderYesInfo.amount} from your account`,
            },
        ]);

        await this.notificationRepository.save(notificationInfos);
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
            makerUserInfo.addBalance(makerOrderInfo.amount * makerOrderInfo.price);

            const takerShareInfo = await this.shareRepository.findOneBy({
                userId: takerOrderInfo.userId,
                outcomeId: takerOrderInfo.outcomeId,
            });

            takerShareInfo.addBalance(BigInt(amount));

            await manager.save(makerUserInfo);
            await manager.save(takerShareInfo);
        });

        const notificationInfos = await this.notificationRepository.create([
            {
                userId: makerOrderId.userId,
                type: 'order_executed',
                message: `You have transferred ${makerOrderInfo.amount} from your account`,
            },
            {
                userId: takerOrderInfo.userId,
                type: 'order_executed',
                message: `You have received ${takerOrderInfo.amount} from your account`,
            },
        ]);

        await this.notificationRepository.save(notificationInfos);
    }
}
