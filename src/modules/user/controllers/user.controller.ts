import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { ProfileResponseDto } from '../dtos/profile.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '@models/entities/user.entity';

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

    @UseGuards(AccessTokenGuard)
    @Get('/profile')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(ProfileResponseDto, EApiOkResponsePayload.OBJECT)
    async getProfile(@CurrentUser() user: UserEntity): Promise<ProfileResponseDto> {
        return {
            username: user.username,
            address: user.address,
            avatar: 'https://example.com/avatar.jpg',
            pnl: 0,
            positionsValue: 0,
            rank: 0,
            volume: 0,
            winRate: 0,
        };
    }
}
