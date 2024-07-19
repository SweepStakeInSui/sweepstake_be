import { UserRepository } from '@models/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { UserInput } from '../types/user.type';
import { UserEntity } from '@models/entities/user.entity';
import { UserError } from '../types/error.type';
import { In } from 'typeorm';

@Injectable()
export class UserService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private readonly userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(UserService.name);
        this.configService = configService;
    }

    async create(userData: UserInput): Promise<UserEntity> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }

    async getById(id: number): Promise<UserEntity> {
        return await this.userRepository.findOneBy({ id: In([id]) });
    }

    async getAll(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async update(id: number, updateData: Partial<UserInput>): Promise<UserEntity> {
        await this.userRepository.update(id, updateData);
        return await this.getById(id);
    }

    async delete(id: number): Promise<void> {
        const result = await this.userRepository.softDelete(id);

        if (!result.affected || result.affected === 0) {
            throw new Error(UserError.UserNotFound);
        }
    }
}
