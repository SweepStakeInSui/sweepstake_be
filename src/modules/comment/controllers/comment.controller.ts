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
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetCommentListResponseDto } from '../dtos/get-comment-list.dto';
import { CreateCommentRequestDto, CreateCommentResponseDto } from '../dtos/create-comment.dto';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { CommentInput } from '@modules/comment/types/comment';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserEntity } from '@models/entities/user.entity';

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
    async createComment(@Body() body: CreateCommentRequestDto, @CurrentUser() userInfo: UserEntity) {
        const { marketId, content, parentCommentId } = body;
        return await this.commentService.createComment(userInfo, marketId, content, parentCommentId);
    }

    @Put(':id')
    async updateComment(
        @Param('id') id: string,
        @Body() updateCommentDto: CommentInput,
        @CurrentUser() userInfo: UserEntity,
    ) {
        return await this.commentService.updateComment(id, updateCommentDto, userInfo);
    }

    @Delete(':id')
    async deleteComment(@Param('id') id: string, @CurrentUser() userInfo: UserEntity) {
        await this.commentService.deleteComment(id, userInfo);
        return { message: 'Comment deleted successfully' };
    }
}
