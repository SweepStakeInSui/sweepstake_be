import { Body, Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import { Pagination } from 'nestjs-typeorm-paginate';
import { BalanceChangeEntity } from '@models/entities/balance-change.entity';
import { ShareService } from '../services/share.service';
import { ShareEntity } from '@models/entities/share.entity';

@ApiTags('user')
@Controller('user')
export class UserController {
    private logger: Logger;

    constructor(
        private loggerService: LoggerService,
        private readonly userService: UserService,
        private readonly walletService: WalletService,
        private readonly shareService: ShareService,
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
            ...user,
            avatar: 'https://example.com/avatar.jpg',
            pnl: 0,
            positionsValue: 0,
            rank: 0,
            volume: 0,
            winRate: 0,
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
        await this.walletService.withdraw(user, body.amount, body.address);

        return {};
    }

    @UseGuards(AccessTokenGuard)
    @Get('/transaction-history')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(ProfileResponseDto, EApiOkResponsePayload.OBJECT)
    async getTransactionHistory(
        @CurrentUser() user: UserEntity,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<Pagination<BalanceChangeEntity>> {
        return await this.walletService.getTransactionHistory(user, page, limit);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/positions')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(ProfileResponseDto, EApiOkResponsePayload.OBJECT)
    async getPositions(
        @CurrentUser() user: UserEntity,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<Pagination<ShareEntity>> {
        // TODO: reduce data size
        return await this.shareService.paginate({ page, limit }, user.id);
    }
}
