import { ShareEntity } from '@models/entities/share.entity';
import { ShareRepository } from '@models/repositories/share.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';

@Injectable()
export class ShareService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private readonly shareRepository: ShareRepository,
    ) {
        this.logger = this.loggerService.getLogger(ShareService.name);
        this.configService = configService;
    }

    public async paginate(options: IPaginationOptions, userId: string): Promise<Pagination<ShareEntity>> {
        return paginate<ShareEntity>(this.shareRepository, options, {
            where: {
                userId,
            },
        });
    }
}
