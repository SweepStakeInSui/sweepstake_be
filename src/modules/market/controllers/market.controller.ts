import { MarketService } from '../services/market.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, Param, Body, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetMarketListRequestDto, GetMarketListResponseDto } from '../dtos/get-market-list.dto';
import { GetMarketRequestDto, GetMarketResponseDto } from '../dtos/get-market.dto';
import { CreateMarketRequestDto, CreateMarketResponseDto } from '../dtos/create-market.dto';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';

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
    @ApiOkResponsePayload(GetMarketListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getMarketList(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<GetMarketListRequestDto> {
        limit = limit > 100 ? 100 : limit;
        return this.marketService.paginate({
            page,
            limit,
        });
    }

    @Get('/:id')
    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetMarketResponseDto, EApiOkResponsePayload.OBJECT)
    async getMarket(@Param() params: GetMarketRequestDto): Promise<GetMarketResponseDto> {
        const { id } = params;
        const investor = await this.marketService.find({
            id,
        });

        return {
            ...investor,
        };
    }

    @UseGuards(AccessTokenGuard)
    @Post('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(CreateMarketResponseDto, EApiOkResponsePayload.OBJECT)
    async createMarket(@Body() body: CreateMarketRequestDto): Promise<CreateMarketResponseDto> {
        this.logger.info(body);

        const { conditions, ...market } = body;

        const result = await this.marketService.create(market, conditions);

        return {
            ...result,
        };
    }
}
