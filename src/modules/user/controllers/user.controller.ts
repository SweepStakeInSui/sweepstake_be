import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';

@ApiTags('user')
@Controller('user')
export class UserController {
    private logger: Logger;

    constructor(
        private loggerService: LoggerService,
        private readonly userService: UserService,
    ) {
        this.logger = this.loggerService.getLogger(UserController.name);
    }
}
