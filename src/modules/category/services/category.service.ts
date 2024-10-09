import { ConfigService } from '@nestjs/config';
import { Logger } from 'log4js';
import Redis from 'ioredis';
import { CategoryRepository } from '@models/repositories/category.repository';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { CategoryEntity } from '@models/entities/category.entity';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private categoryRepository: CategoryRepository,
    ) {
        this.logger = this.loggerService.getLogger(CategoryService.name);
        this.configService = configService;
    }

    async createCategory(name: string): Promise<CategoryEntity> {
        const category = this.categoryRepository.create({ name });
        return this.categoryRepository.save(category);
    }

    async getCategoryById(id: string): Promise<CategoryEntity> {
        return this.categoryRepository.findOne({ where: { id } });
    }

    async getAllCategories(): Promise<CategoryEntity[]> {
        return this.categoryRepository.find();
    }

    //TODO: should i remove this method?
    async updateCategory(id: string, name: string): Promise<CategoryEntity> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new Error('Category not found');
        }
        category.name = name;
        return this.categoryRepository.save(category);
    }

    async deleteCategory(id: string): Promise<void> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new Error('Category not found');
        }
        await this.categoryRepository.delete({ id });
    }
}
