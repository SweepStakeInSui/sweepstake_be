import { UserRepository } from '@models/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { UserEntity } from '@models/entities/user.entity';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { TransactionService } from '@modules/chain/services/transaction.service';

@Injectable()
export class WalletService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly kafkaProducer: KafkaProducerService,
        private readonly transactionService: TransactionService,
        private readonly userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(WalletService.name);
        this.configService = configService;
    }

    public async requestDeposit(userInfo: UserEntity, amount: bigint) {
        const tx = this.transactionService.buildGasslessTransaction(
            userInfo.address,
            await this.transactionService.buildDepositTransaction(userInfo.address, amount),
        );

        return tx;
    }

    public async deposit(userInfo: UserEntity, txBytes: string, signature: string[]) {
        // TODO: only add balance after tx is successful
        // userInfo.balance += amount;
        // const txResp = await this.transactionService.submitTransaction(txBytes, signature);

        // console.log(txResp);

        // TODO: build deposit transaction

        // TODO: push deposit transaction job
        const msgMetadata = await this.kafkaProducer.produce({
            topic: KafkaTopic.SUBMIT_TRANSACTION,
            messages: [
                {
                    value: JSON.stringify({ txData: txBytes, signature: signature }),
                },
            ],
        });

        console.log(msgMetadata);
    }

    public async withdraw(userInfo: UserEntity, amount: bigint, address: string) {
        if (userInfo.balance < amount) {
            throw new Error('InsufficientBalance');
        }

        userInfo.balance -= amount;

        await this.userRepository.save(userInfo);

        const { bytes, signature } = await this.transactionService.signAdminTransaction(
            await this.transactionService.buildWithdrawTransaction(address, amount),
        );

        const msgMetadata = await this.kafkaProducer.produce({
            topic: KafkaTopic.SUBMIT_TRANSACTION,
            messages: [
                {
                    value: JSON.stringify({ txData: bytes, signature: signature }),
                },
            ],
        });

        console.log(msgMetadata);
    }
}
