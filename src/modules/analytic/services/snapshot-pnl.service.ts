import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotTime } from '../types/snapshot.type';
import { SnapshotPnlRepository } from '@models/repositories/snapshot-pnl.repository';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { SnapshotBalanceRepository } from '@models/repositories/snapshot-balance.repository';
import { UserService } from '@modules/user/services/user.service';

@Injectable()
export class SnapshotPnlService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly kafkaProducer: KafkaProducerService,

        private readonly snapshotPnlRepository: SnapshotPnlRepository,
        private readonly snapshotBalanceRepository: SnapshotBalanceRepository,

        private readonly userService: UserService,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotPnlService.name);
        this.configService = configService;
    }

    async snapshot(userId: string, timestamp: number) {
        const { pnl, totalValue } = await this.userService.getCurrentPnl(userId);

        const snapshotPnlInfo = this.snapshotPnlRepository.create({
            userId,
            timestamp,
            value: pnl,
            snapshotTime: SnapshotTime.FourHours,
        });

        const snapshotBalanceInfo = this.snapshotBalanceRepository.create({
            userId,
            timestamp,
            value: totalValue,
            snapshotTime: SnapshotTime.FourHours,
        });

        await this.snapshotPnlRepository.manager.transaction(async manager => {
            await manager.save(snapshotBalanceInfo);
            await manager.save(snapshotPnlInfo);
        });

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
