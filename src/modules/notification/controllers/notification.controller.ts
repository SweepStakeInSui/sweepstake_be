import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Body, Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserEntity } from '@models/entities/user.entity';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { NotificationService } from '../services/notification.service';
import { GetNotificationResponseDto } from '../dtos/get-notification.dto';
import { SeenRequestDto, SeenResponseDto } from '../dtos/seen.dto';

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
    async getNotification(
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

    @Post('/seen')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(SeenResponseDto, EApiOkResponsePayload.OBJECT, true)
    async seen(@Body() body: SeenRequestDto, @CurrentUser() userInfo: UserEntity): Promise<SeenResponseDto> {
        await this.notificationService.seen(body.notificationId, userInfo.id);

        return {};
    }
}
