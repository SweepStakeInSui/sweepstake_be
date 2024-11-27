import { LoggerService } from '@shared/modules/loggers/logger.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { MarketRepository } from '@models/repositories/market.repository';
import { BadRequestException } from '@nestjs/common';
import { OracleRepository } from '@models/repositories/oracle.repository';
import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { ShareRepository } from '@models/repositories/share.repository';
import { UserRepository } from '@models/repositories/user.repository';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';

export class RewardService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private kafkaProducer: KafkaProducerService,
        private marketRespository: MarketRepository,
        private oracleRepository: OracleRepository,
        private outcomeRepository: OutcomeRepository,
        private shareRepository: ShareRepository,
        private userRepository: UserRepository,
        private transactionService: TransactionService,
    ) {
        this.logger = this.loggerService.getLogger(RewardService.name);
        this.configService = configService;
    }

    public async syncReward(marketId: string) {
        // sync reward
        const marketInfo = await this.marketRespository.findOneBy({ id: marketId });
        const oracleInfo = await this.oracleRepository.findOneBy({ marketId: marketId });

        if (!marketInfo || !oracleInfo) {
            throw new BadRequestException('Market not found');
        }
        const winner = oracleInfo.winner.toString() === 'true';
        const { bytes, signature } = await this.transactionService.signAdminTransaction(
            await this.transactionService.buildClaimRewardTransaction(marketInfo.id, marketInfo.onchainId, winner),
        );

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.SUBMIT_TRANSACTION,
            messages: [
                {
                    value: JSON.stringify({
                        txData: bytes,
                        signature: signature,
                    }),
                },
            ],
        });
        console.log(msgMetaData);
    }
}
