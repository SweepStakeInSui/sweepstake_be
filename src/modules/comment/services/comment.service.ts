import { BadRequestException } from '@nestjs/common';
import { CommentRepository } from '@models/repositories/comment.repository';
import { CommentInput } from '../types/comment';
import { CommentEntity } from '@models/entities/comment.entity';
import { UserRepository } from '@models/repositories/user.repository';
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

export class CommentService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private readonly commentRepository: CommentRepository,
        private readonly userRepository: UserRepository,
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
            relations: ['user', 'market'],
            where: where,
        });
    }

    public async getCommentsByMarket(
        marketId: string,
        options: IPaginationOptions,
    ): Promise<Pagination<CommentEntity>> {
        return this.paginate(options, { market: { id: marketId }, parentComment: null });
    }

    public async getCommentsByUser(username: string): Promise<CommentEntity[]> {
        return await this.commentRepository
            .createQueryBuilder('comment')
            .leftJoinAndSelect('comment.user', 'user')
            .leftJoinAndSelect('comment.market', 'market')
            .leftJoinAndSelect('comment.replies', 'replies')
            .where('user.username = :username', { username })
            .andWhere('comment.parentComment IS NULL')
            .getMany();
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

        const comment = new CommentEntity();
        comment.content = content;
        comment.user = userInfo;
        comment.market = market;
        comment.likes = 0;

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

        if (comment.likedBy.some(user => user.id === userInfo.id)) {
            throw new BadRequestException('User has already liked this comment');
        }

        comment.likes += 1;
        comment.likedBy.push(userInfo);
        await this.commentRepository.save(comment);
        return true;
    }

    async updateComment(id: string, updateCommentDto: CommentInput, userInfo: UserEntity) {
        const comment = await this.commentRepository.findOne({ where: { id } });
        if (!comment || comment.user.id !== userInfo.id) {
            return null;
        }
        Object.assign(comment, updateCommentDto);
        return this.commentRepository.save(comment);
    }

    async deleteComment(id: string, userInfo: UserEntity) {
        const comment = await this.commentRepository.findOne({ where: { id } });
        if (!comment || comment.user.id !== userInfo.id) {
            return false;
        }
        await this.commentRepository.remove(comment);
        return true;
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
