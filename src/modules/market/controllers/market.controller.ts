import { MarketService } from '../services/market.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, Param, Body, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetMarketListRequestDto, GetMarketListResponseDto } from '../dtos/get-market-list.dto';
import { GetMarketRequestDto, GetMarketResponseDto } from '../dtos/get-market.dto';
import { CreateMarketRequestDto, CreateMarketResponseDto } from '../dtos/create-market.dto';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { UserEntity } from '@models/entities/user.entity';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';

@ApiTags('market')
// @UseGuards(UserGuard)
@Controller('market')
export class MarketController {
    constructor(
        private loggerService: LoggerService,
        private marketService: MarketService,
    ) {
        this.logger = this.loggerService.getLogger(MarketController.name);
    }

    private logger: Logger;

    @Get('/')
    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'name', required: false, type: Number })
    @ApiOkResponsePayload(GetMarketListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getMarketList(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query('name') name: string,
    ): Promise<GetMarketListRequestDto> {
        limit = limit > 100 ? 100 : limit;
        return this.marketService.paginate(
            {
                page,
                limit,
            },
            { name },
        );
    }

    @Get('/search')
    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetMarketListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async searchByName(@Query('name') name: string): Promise<GetMarketListRequestDto> {
        return this.marketService.search(name);
    }

    @Get('/:id')
    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetMarketResponseDto, EApiOkResponsePayload.OBJECT)
    async getMarket(@Param() params: GetMarketRequestDto): Promise<GetMarketResponseDto> {
        const { id } = params;
        const market = await this.marketService.find({
            id,
        });

        return market;
    }

    @UseGuards(AccessTokenGuard)
    @Post('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(CreateMarketResponseDto, EApiOkResponsePayload.OBJECT)
    async createMarket(
        @Body() body: CreateMarketRequestDto,
        @CurrentUser() user: UserEntity,
    ): Promise<CreateMarketResponseDto> {
        this.logger.info(body);

        const { conditions, ...market } = body;

        // TODO: use the real implementation
        const result = await this.marketService.create2(user, market, conditions);

        return {
            ...result,
        };
    }

    @Get('/category')
    @ApiOperation({
        description: 'Find markets by category',
    })
    async findMarketsByCategory(@Query('category') category: string): Promise<GetMarketResponseDto> {
        const markets = await this.marketService.findMarketsByCategory([category]);
        return {
            markets,
        };
    }
}
