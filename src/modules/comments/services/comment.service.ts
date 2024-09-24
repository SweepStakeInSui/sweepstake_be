import { Injectable, BadRequestException } from '@nestjs/common';
import { CommentRepository } from '@models/repositories/comment.repository';
import { CommentInput } from '@modules/comments/types/comment';
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

@Injectable()
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

    public async create(commentInput: CommentInput): Promise<CommentEntity> {
        const user = await this.userRepository.findOneBy({ username: commentInput.username });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const market = await this.marketRepository.findOneBy({ name: commentInput.marketName });
        if (!market) {
            throw new BadRequestException('Market not found');
        }

        const commentInfo = this.commentRepository.create(commentInput);
        return await this.commentRepository.save(commentInfo);
    }

    public async getCommentsByMarket(marketName: string): Promise<CommentEntity[]> {
        return await this.commentRepository
            .createQueryBuilder('comment')
            .leftJoinAndSelect('comment.user', 'user')
            .leftJoinAndSelect('comment.market', 'market')
            .leftJoinAndSelect('comment.replies', 'replies')
            .where('market.name = :marketName', { marketName })
            .andWhere('comment.parentComment IS NULL')
            .getMany();
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

    async update(id: string, updateData: Partial<CommentInput>): Promise<CommentEntity> {
        await this.commentRepository.update(id, updateData);
        return await this.commentRepository.findOneBy({ id });
    }

    async delete(id: string): Promise<void> {
        const result = await this.commentRepository.softDelete(id);

        if (!result.affected || result.affected === 0) {
            throw new BadRequestException('Comment not found');
        }
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
