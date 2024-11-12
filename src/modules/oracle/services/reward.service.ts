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
import { OutcomeType } from '@modules/market/types/outcome';
import { ShareRepository } from '@models/repositories/share.repository';
import { UserRepository } from '@models/repositories/user.repository';
import { TransactionService } from '@modules/chain/services/transaction.service';

export class RewardService {
    protected logger: Logger;
    protected configService: ConfigService;

    // Reward Part

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
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
        const transaction = await this.transactionService.buildClaimRewardTransaction(
            marketInfo.id,
            marketInfo.onchainId,
            oracleInfo.winner,
        );
        await this.transactionService.signAdminAndExecuteTransaction(transaction);

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
                const newBalance = holder.user.balance + holder.balance;
                await this.userRepository.update(holder.user.id, {
                    balance: newBalance,
                });
            }),
        );
    }
}
