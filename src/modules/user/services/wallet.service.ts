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
import { BalanceChangeRepository } from '@models/repositories/balance-change.repository';
import { paginate } from 'nestjs-typeorm-paginate';
import { BalanceChangeEntity } from '@models/entities/balance-change.entity';
import { BalanceChangeType } from '../types/balance-change.type';
import { FindOptionsWhere } from 'typeorm';

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
        private readonly balanceChangeRepository: BalanceChangeRepository,
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
        userInfo.reduceBalance(amount);

        const withdrawInfo = this.balanceChangeRepository.create({
            userId: userInfo.id,
            amount,
            type: BalanceChangeType.Withdraw,
            to: address,
        });

        await this.userRepository.manager.transaction(async manager => {
            await manager.save(userInfo);
            await manager.save(withdrawInfo);
        });

        const { bytes, signature } = await this.transactionService.signAdminTransaction(
            await this.transactionService.buildWithdrawTransaction(address, withdrawInfo.id, amount),
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

    public async getTransactionHistory(
        userInfo: UserEntity,
        page: number,
        limit: number,
        where: FindOptionsWhere<BalanceChangeEntity>,
    ) {
        return await paginate<BalanceChangeEntity>(
            this.balanceChangeRepository,
            {
                page,
                limit,
            },
            {
                where: { userId: userInfo.id, ...where },
                order: { timestamp: 'DESC' },
            },
        );
    }
}
