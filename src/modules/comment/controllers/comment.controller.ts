import { CommentService } from '@modules/comment/services/comment.service';
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
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetCommentListResponseDto } from '../dtos/get-comment-list.dto';
import { CreateCommentRequestDto, CreateCommentResponseDto } from '../dtos/create-comment.dto';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { CommentInput } from '@modules/comment/types/comment';

@ApiTags('comment')
// @UseGuards(UserGuard)
@Controller('comment')
export class CommentController {
    constructor(
        private loggerService: LoggerService,
        private commentService: CommentService,
    ) {
        this.logger = this.loggerService.getLogger(CommentController.name);
    }

    private logger: Logger;

    @Get('/')
    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'id', required: false, type: String })
    @ApiOkResponsePayload(GetCommentListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getCommentList(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query('id') id: string,
    ): Promise<GetCommentListResponseDto> {
        limit = limit > 100 ? 100 : limit;
        return this.commentService.paginate(
            {
                page,
                limit,
            },
            { id },
        );
    }

    @Get('/market/:marketId')
    // @ApiBearerAuth()
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

    @UseGuards(AccessTokenGuard)
    @Post('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: 'Create a new comment',
    })
    @ApiOkResponsePayload(CreateCommentResponseDto, EApiOkResponsePayload.OBJECT, true)
    async createComment(@Body() body: CreateCommentRequestDto, @Req() req: Request): Promise<CreateCommentResponseDto> {
        this.logger.info(body);

        const userId = (req as any).user['id']; // Lấy userId từ token
        const { marketId, content, parentCommentId } = body;

        const result = await this.commentService.createComment(userId, marketId, content, parentCommentId);

        return {
            ...result,
            createdAt: new Date(result.createdAt),
            updatedAt: new Date(result.updatedAt),
        };
    }

    @Put(':id')
    async updateComment(@Param('id') id: string, @Body() updateCommentDto: CommentInput, @Req() req: Request) {
        const userId = (req as any).user.id;
        return await this.commentService.updateComment(id, updateCommentDto, userId);
    }

    @Delete(':id')
    async deleteComment(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user.id;
        await this.commentService.deleteComment(id, userId);

        return { message: 'Comment deleted successfully' };
    }
}
