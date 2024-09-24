import { CommentService } from '@modules/comments/services/comment.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, Param, Body, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetCommentListResponseDto } from '@modules/comments/dtos/get-comment-list.dto';
import { GetCommentRequestDto, GetCommentResponseDto } from '@modules/comments/dtos/get-comment.dto';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { CreateCommentRequestDto, CreateCommentResponseDto } from '@modules/comments/dtos/create-comment.dto';

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
    @ApiQuery({ name: 'commentId', required: false, type: String })
    @ApiOkResponsePayload(GetCommentListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getCommentList(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query('commentId') commentId: string,
    ): Promise<GetCommentListResponseDto> {
        limit = limit > 100 ? 100 : limit;
        return this.commentService.paginate(
            {
                page,
                limit,
            },
            { id: commentId },
        );
    }

    @Get('/:id')
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetCommentResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getComment(@Param() params: GetCommentRequestDto): Promise<GetCommentResponseDto> {
        const { id } = params;
        const investor = await this.commentService.find({
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
    @ApiOkResponsePayload(GetCommentResponseDto, EApiOkResponsePayload.OBJECT, true)
    async createComment(@Body() body: CreateCommentRequestDto): Promise<CreateCommentResponseDto> {
        this.logger.info(body);

        const { ...comment } = body;

        const result = await this.commentService.create(comment);

        return {
            ...result,
        };
    }
}
