import { UserEntity } from '@models/entities/user.entity';
import { UserRepository } from '@models/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class LeaderboardService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,

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
