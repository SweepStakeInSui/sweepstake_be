import { MarketService } from '../services/market.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetMarketListRequestDto, GetMarketListResponseDto } from '../dtos/get-market-list.dto';
import { GetMarketRequestDto, GetMarketResponseDto } from '../dtos/get-market.dto';
import { CreateMarketRequestDto, CreateMarketResponseDto } from '../dtos/create-market.dto';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { UserEntity } from '@models/entities/user.entity';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { CommentService } from '@modules/comment/services/comment.service';
import { GetCommentListResponseDto } from '@modules/comment/dtos/get-comment-list.dto';
import {
    CreateCommentRequestDto,
    CreateCommentResponseDto,
    UpdateCommentDto,
} from '@modules/comment/dtos/create-comment.dto';
import { GetOrderBookResponseDto } from '../dtos/get-order-book.dto';

@ApiTags('market')
// @UseGuards(UserGuard)
@Controller('market')
export class MarketController {
    constructor(
        private loggerService: LoggerService,
        private marketService: MarketService,
        private commentService: CommentService,
    ) {
        this.logger = this.loggerService.getLogger(MarketController.name);
    }

    private logger: Logger;

    @Get('/popular')

    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetMarketListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getPopularMarket(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<GetMarketListRequestDto> {
        limit = limit > 100 ? 100 : limit;
        return await this.marketService.popular({
            page,
            limit,
        });
    }

    @Get('/')
    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'name', required: false, type: String })
    @ApiQuery({ name: 'category', required: false, type: String })
    @ApiQuery({ name: 'user', required: false, type: String })
    @ApiOkResponsePayload(GetMarketListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getMarketList(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query('name') name?: string,
        @Query('user') userId?: string,
        @Query('category') categories?: string,
    ): Promise<GetMarketListRequestDto> {
        limit = limit > 100 ? 100 : limit;
        return this.marketService.paginate(
            {
                page,
                limit,
            },
            { name, categories, userId },
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

        // TODO: use the real implementation
        const result = await this.marketService.create(user, body);

        return {
            ...result,
        };
    }

    // Market comments
    @Get('/comments/:marketId')
    @ApiOperation({
        description: 'Get comments for a market',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(GetCommentListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getCommentsByMarket(
        @Param('marketId') marketId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<GetCommentListResponseDto> {
        limit = limit > 100 ? 100 : limit;
        return this.commentService.getCommentsByMarket(marketId, { page, limit });
    }

    @Get('/comments/user/:userId')
    @ApiOperation({
        description: 'Get comments for a user',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(GetCommentListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getCommentsByUser(
        @Param('userId') userId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<GetCommentListResponseDto> {
        limit = limit > 100 ? 100 : limit;
        return this.commentService.getCommentsByUser(userId, { page, limit });
    }

    @UseGuards(AccessTokenGuard)
    @Post('/comments')
    @ApiBearerAuth()
    @ApiOperation({
        description: 'Create a new comment',
    })
    @ApiOkResponsePayload(CreateCommentResponseDto, EApiOkResponsePayload.OBJECT, true)
    async createComment(@Body() body: CreateCommentRequestDto, @CurrentUser() userInfo: UserEntity) {
        const { marketId, content, parentCommentId } = body;
        return await this.commentService.createComment(userInfo, marketId, content, parentCommentId);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/comments/like/:id')
    @ApiBearerAuth()
    @ApiOperation({
        description: 'Like a comment',
    })
    @ApiOkResponsePayload(Boolean, EApiOkResponsePayload.OBJECT, true)
    async likeComment(@Param('id') id: string, @CurrentUser() userInfo: UserEntity) {
        return await this.commentService.likeComment(id, userInfo);
    }

    @UseGuards(AccessTokenGuard)
    @Put('/comments/:id')
    async updateComment(
        @Param('id') id: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @CurrentUser() userInfo: UserEntity,
    ) {
        return await this.commentService.updateComment(id, updateCommentDto, userInfo);
    }

    @UseGuards(AccessTokenGuard)
    @Delete('/comments/:id')
    @ApiOkResponsePayload(Boolean, EApiOkResponsePayload.OBJECT)
    async deleteComment(@Param('id') id: string, @CurrentUser() userInfo: UserEntity): Promise<boolean> {
        await this.commentService.deleteComment(id, userInfo);
        return true;
    }

    @Get('/order-book/:marketId')
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetOrderBookResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getOrderBook(@Param('marketId') marketId: string): Promise<any> {
        return await this.marketService.getOrderBook(marketId);
    }

    @Get('/top-holders/:marketId')
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetOrderBookResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getTopHolders(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Param('marketId') marketId: string,
    ): Promise<GetMarketListRequestDto> {
        limit = limit > 100 ? 100 : limit;
        return await this.marketService.getTopHolders(
            {
                page,
                limit,
            },
            marketId,
        );
    }
}
