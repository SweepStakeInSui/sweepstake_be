import { UserRepository } from '@models/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { UserInput } from '../types/user.type';
import { UserEntity } from '@models/entities/user.entity';
import { UserError } from '../types/error.type';
import { In } from 'typeorm';
import { UpdateProfileRequestDto } from '../dtos/update-profile.dto';
import { ShareRepository } from '@models/repositories/share.repository';
import { BalanceChangeRepository } from '@models/repositories/balance-change.repository';
import { BalanceChangeType } from '../types/balance-change.type';

@Injectable()
export class UserService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private readonly userRepository: UserRepository,
        private readonly shareRepository: ShareRepository,
        private readonly balanceChangeRepository: BalanceChangeRepository,
    ) {
        this.logger = this.loggerService.getLogger(UserService.name);
        this.configService = configService;
    }

    async create(userData: UserInput): Promise<UserEntity> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }

    async getById(id: string): Promise<UserEntity> {
        return await this.userRepository.findOneBy({ id: In([id]) });
    }

    async getAll(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async update(id: string, updateData: UpdateProfileRequestDto): Promise<UserEntity> {
        await this.userRepository.update(id, updateData);
        return await this.getById(id);
    }

    async delete(id: string): Promise<void> {
        const result = await this.userRepository.softDelete(id);

        if (!result.affected || result.affected === 0) {
            throw new Error(UserError.UserNotFound);
        }
    }

    async getCurrentPnl(userId: string) {
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

        return { totalValue, pnl };
    }
}
