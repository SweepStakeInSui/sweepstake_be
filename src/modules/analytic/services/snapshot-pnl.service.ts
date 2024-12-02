import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotTime } from '../types/snapshot.type';
import { SnapshotPnlRepository } from '@models/repositories/snapshot-pnl.repository';
import { UserRepository } from '@models/repositories/user.repository';
import { ShareRepository } from '@models/repositories/share.repository';
import { BalanceChangeRepository } from '@models/repositories/balance-change.repository';
import { BalanceChangeType } from '@modules/user/types/balance-change.type';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';

@Injectable()
export class SnapshotPnlService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly kafkaProducer: KafkaProducerService,

        private readonly userRepository: UserRepository,
        private readonly shareRepository: ShareRepository,

        private readonly snapshotPnlRepository: SnapshotPnlRepository,
        private readonly balanceChangeRepository: BalanceChangeRepository,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotPnlService.name);
        this.configService = configService;
    }

    async snapshot(userId: string, timestamp: number) {
        const user = await this.userRepository.findOneBy({
            id: userId,
        });

        const shareInfos = await this.shareRepository.find({
            where: {
                userId: userId,
            },
            relations: ['outcome'],
        });

        const sharesValue = shareInfos.reduce((acc, share) => {
            return (
                acc + share.balance * ((share.outcome.askPrice - share.outcome.bidPrice) / 2n + share.outcome.bidPrice)
            );
        }, 0n);

        const totalValue = user.balance + sharesValue;

        const balanceHistoryInfos = await this.balanceChangeRepository.find({
            where: {
                userId: userId,
            },
        });

        const withdrawValue = balanceHistoryInfos
            .filter(balanceHistoryInfo => balanceHistoryInfo.type === BalanceChangeType.Withdraw)
            .reduce((acc, balanceHistoryInfo) => acc + balanceHistoryInfo.amount, 0n);

        const depositValue = balanceHistoryInfos
            .filter(balanceHistoryInfo => balanceHistoryInfo.type === BalanceChangeType.Deposit)
            .reduce((acc, balanceHistoryInfo) => acc + balanceHistoryInfo.amount, 0n);

        const pnl = totalValue + withdrawValue - depositValue;

        const snapshotPnlInfo = this.snapshotPnlRepository.create({
            userId,
            timestamp,
            value: pnl,
            snapshotTime: SnapshotTime.FourHours,
        });

        await this.snapshotPnlRepository.save(snapshotPnlInfo);

        const msgMetaDataAnalytic = await this.kafkaProducer.produce({
            topic: KafkaTopic.CALCULATE_PNL_LEADERBOARD,
            messages: [
                {
                    value: JSON.stringify({
                        userId,
                        value: totalValue,
                        timestamp,
                    }),
                },
            ],
        });

        console.log(msgMetaDataAnalytic);
    }
}
