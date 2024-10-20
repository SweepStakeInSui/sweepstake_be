import { BadRequestException } from '@nestjs/common';
import { CommentRepository } from '@models/repositories/comment.repository';
import { CommentEntity } from '@models/entities/comment.entity';
import { MarketRepository } from '@models/repositories/market.repository';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere } from 'typeorm';
import { UserEntity } from '@models/entities/user.entity';
import { UpdateCommentDto } from '@modules/comment/dtos/create-comment.dto';

export class CommentService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private readonly commentRepository: CommentRepository,
        private readonly marketRepository: MarketRepository,
    ) {
        this.logger = this.loggerService.getLogger(CommentService.name);
        this.configService = configService;
    }

    public async paginate(
        options: IPaginationOptions,
        where: FindOptionsWhere<CommentEntity>,
    ): Promise<Pagination<CommentEntity>> {
        return paginate<CommentEntity>(this.commentRepository, options, {
            where: where,
        });
    }

    public async getCommentsByMarket(
        marketId: string,
        options: IPaginationOptions,
    ): Promise<Pagination<CommentEntity>> {
        return paginate<CommentEntity>(this.commentRepository, options, {
            where: { marketId },
            relations: ['parentComment'],
        });
    }

    public async getCommentsByUser(userId: string, options: IPaginationOptions): Promise<Pagination<CommentEntity>> {
        return paginate<CommentEntity>(this.commentRepository, options, {
            where: { userId },
            relations: ['parentComment'],
        });
    }

    public async createComment(
        userInfo: UserEntity,
        marketId: string,
        content: string,
        parentCommentId?: string,
    ): Promise<CommentEntity> {
        const market = await this.marketRepository.findOneBy({ id: marketId });
        if (!market) {
            throw new BadRequestException('Market not found');
        }

        const comment = this.commentRepository.create({
            content,
            marketId,
            userId: userInfo.id,
            username: userInfo.username,
            avatar: userInfo.avatar,
        });

        if (parentCommentId) {
            const parentComment = await this.commentRepository.findOneBy({ id: parentCommentId });
            if (parentComment) {
                comment.parentComment = parentComment;
            }
        }

        return await this.commentRepository.save(comment);
    }

    public async likeComment(id: string, userInfo: UserEntity) {
        const comment = await this.commentRepository.findOne({ where: { id } });
        if (!comment) {
            return false;
        }

        if (!comment.likedBy) {
            comment.likedBy = [];
        }

        const userIndex = comment.likedBy.indexOf(userInfo.id);
        // If user already liked the comment, remove the like
        if (userIndex !== -1) {
            comment.likes -= 1;
            comment.likedBy.splice(userIndex, 1);
        } else {
            comment.likes += 1;
            comment.likedBy.push(userInfo.id);
        }

        await this.commentRepository.save(comment);
        return true;
    }

    async updateComment(id: string, updateCommentDto: UpdateCommentDto, userInfo: UserEntity) {
        const comment = await this.commentRepository.findOne({ where: { id } });
        if (!comment || comment.userId !== userInfo.id) {
            return null;
        }
        Object.assign(comment, updateCommentDto);
        return this.commentRepository.save(comment);
    }

    async deleteComment(id: string, userInfo: UserEntity) {
        const comment = await this.commentRepository.findOne({ where: { id } });
        if (!comment || comment.userId !== userInfo.id) {
            throw new Error('Comment not found');
        }
        await this.commentRepository.remove(comment);
    }

    async getById(id: string): Promise<CommentEntity> {
        return await this.commentRepository.findOneBy({ id });
    }

    async find(id: FindOptionsWhere<CommentEntity>) {
        try {
            const commentInfo = await this.commentRepository.findOneBy(id);

            this.logger.info(commentInfo);
            return commentInfo;
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestException();
        }
    }
}
