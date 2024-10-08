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
            userInfo.balance += BigInt(amount);

            await this.userRepository.save(userInfo);
        } else {
            this.logger.error('User not found');
        }
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
            shareInfo.amount += BigInt(amount);
        } else {
            shareInfo = this.shareRepository.create({
                userId: orderInfo.userId,
                outcomeId: orderInfo.outcomeId,
                amount: BigInt(amount),
            });
        }

        await this.shareRepository.save(shareInfo);
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
            shareInfo.amount += BigInt(amount);
        } else {
            shareInfo = this.shareRepository.create({
                userId: orderInfo.userId,
                outcomeId: orderInfo.outcomeId,
                amount: BigInt(amount),
            });
        }

        await this.shareRepository.save(shareInfo);
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

        userYesInfo.balance += orderYesInfo.amount * orderYesInfo.price;
        userNoInfo.balance += orderNoInfo.amount * orderNoInfo.price;

        await this.userRepository.manager.transaction(async manager => {
            await manager.save(userYesInfo);
            await manager.save(userNoInfo);
        });
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
            makerUserInfo.balance += makerOrderInfo.amount * makerOrderInfo.price;

            const takerShareInfo = await this.shareRepository.findOneBy({
                userId: takerOrderInfo.userId,
                outcomeId: takerOrderInfo.outcomeId,
            });

            takerShareInfo.amount += amount;

            await manager.save(makerUserInfo);
            await manager.save(takerShareInfo);
        });
    }
}
