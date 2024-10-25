import { NotificationEntity } from '@models/entities/notification.entity';
import { NotificationRepository } from '@models/repositories/notification.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { DeepPartial, FindOptionsWhere, In } from 'typeorm';
import { NotificationStatus } from '../types/notification';

@Injectable()
export class NotificationService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly notificationRepository: NotificationRepository,
    ) {}

    public async paginate(
        options: IPaginationOptions,
        where: FindOptionsWhere<NotificationEntity>,
    ): Promise<Pagination<NotificationEntity>> {
        return paginate<NotificationEntity>(this.notificationRepository, options, {
            where: where,
            order: {
                status: 'asc',
                timestamp: 'desc',
            },
        });
    }

    public async create(notifications: DeepPartial<NotificationEntity>[]) {
        const notificationInfos = this.notificationRepository.create(notifications);
        await this.notificationRepository.save(notificationInfos);
    }

    public async seen(notificationIds: string[], userId: string): Promise<void> {
        await this.notificationRepository.update(
            { id: In(notificationIds), userId },
            { status: NotificationStatus.Read },
        );
    }
}
