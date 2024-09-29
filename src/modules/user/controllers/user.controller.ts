import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { ProfileResponseDto } from '../dtos/profile.dto';
import { UserEntity } from '@models/entities/user.entity';
import { DepositRequestDto, DepositResponseDto } from '../dtos/deposit.dto';
import { WithdrawRequestDto, WithdrawResponseDto } from '../dtos/withdraw.dto';
import { WalletService } from '../services/wallet.service';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { RequestDepositRequestDto } from '../dtos/request-deposit.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
    private logger: Logger;

    constructor(
        private loggerService: LoggerService,
        private readonly userService: UserService,
        private readonly walletService: WalletService,
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
            balance: user.balance,
        };
    }

    @UseGuards(AccessTokenGuard)
    @Post('/deposit')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(DepositResponseDto, EApiOkResponsePayload.OBJECT)
    async deposit(@Body() body: DepositRequestDto, @CurrentUser() user: UserEntity): Promise<DepositResponseDto> {
        await this.walletService.deposit(user, body.txBytes, body.signature);
        return {};
    }

    @UseGuards(AccessTokenGuard)
    @Post('/request-deposit')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(DepositResponseDto, EApiOkResponsePayload.OBJECT)
    async requestDeposit(
        @Body() body: RequestDepositRequestDto,
        @CurrentUser() user: UserEntity,
    ): Promise<DepositResponseDto> {
        return await this.walletService.requestDeposit(user, body.amount);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/withdraw')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(WithdrawResponseDto, EApiOkResponsePayload.OBJECT)
    async withdraw(@Body() body: WithdrawRequestDto, @CurrentUser() user: UserEntity): Promise<WithdrawResponseDto> {
        await this.walletService.withdraw(user, body.amount);

        return {};
    }
}
