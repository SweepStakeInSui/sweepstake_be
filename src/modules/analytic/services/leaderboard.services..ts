import { UserEntity } from '@models/entities/user.entity';
import { UserRepository } from '@models/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class LeaderboardService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(LeaderboardService.name);
        this.configService = configService;
    }

    async getTopVolume(options: IPaginationOptions) {
        const user = await paginate<UserEntity>(this.userRepository, options, {
            order: {
                volume: 'DESC',
            },
        });

        return user;
    }

    // TODO: Implement getTopProfit
    async getTopProfit(options: IPaginationOptions) {
        const user = await paginate<UserEntity>(this.userRepository, options, {
            order: {
                volume: 'DESC',
            },
        });

        return user;
    }
}
