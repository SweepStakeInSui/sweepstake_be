import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';

export class JobService {
    constructor(private loggerService: LoggerService) {
        this.logger = this.loggerService.getLogger(JobService.name);
    }

    private logger: Logger;
    protected configService: ConfigService;
}
