import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserEntity } from '@models/entities/user.entity';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { NotificationService } from '../services/notification.service';
import { GetNotificationResponseDto } from '../dtos/get-notification';

@ApiTags('notification')
@UseGuards(AccessTokenGuard)
@Controller('notification')
export class NotificationController {
    constructor(
        private loggerService: LoggerService,
        private notificationService: NotificationService,
    ) {
        this.logger = this.loggerService.getLogger(NotificationController.name);
    }

    private logger: Logger;

    @Get('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetNotificationResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getMarketList(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @CurrentUser() userInfo: UserEntity,
    ): Promise<GetNotificationResponseDto> {
        limit = limit > 50 ? 50 : limit;
        return await this.notificationService.paginate(
            {
                page,
                limit,
            },
            { userId: userInfo.id },
        );
    }
}
