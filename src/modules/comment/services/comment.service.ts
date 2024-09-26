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
        userId: string,
        marketId: string,
        content: string,
        parentCommentId?: string,
    ): Promise<CommentEntity> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const market = await this.marketRepository.findOneBy({ id: marketId });
        if (!market) {
            throw new BadRequestException('Market not found');
        }

        const comment = new CommentEntity();
        comment.content = content;
        comment.user = user;
        comment.market = market;

        if (parentCommentId) {
            const parentComment = await this.commentRepository.findOneBy({ id: parentCommentId });
            if (parentComment) {
                comment.parentComment = parentComment;
            }
        }

        return await this.commentRepository.save(comment);
    }

    async updateComment(id: string, updateCommentDto: CommentInput, userId: string) {
        const comment = await this.commentRepository.findOne({ where: { id } });
        if (!comment || comment.user.id !== userId) {
            return null;
        }
        Object.assign(comment, updateCommentDto);
        return this.commentRepository.save(comment);
    }

    async deleteComment(id: string, userId: string) {
        const comment = await this.commentRepository.findOne({ where: { id } });
        if (!comment || comment.user.id !== userId) {
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
