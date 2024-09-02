/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { Redis } from 'ioredis';
import { JwtPayload, RefreshJwtPayload } from '../types/jwt-payload';
import { AuthType } from '../types/auth';
// import { EmailRegisterPayload, RegisterPayload, WalletRegisterPayload } from '../dtos/register.dto';
import { AuthRepository } from '@models/repositories/auth.repository';
import { UserRepository } from '@models/repositories/user.repository';
import { jwtRefreshConfig } from '@config/jwt.config';
import { verifySignature } from '@shared/utils/sui';
import { UserEntity } from '@models/entities/user.entity';
import { EmailLoginPayload, WalletLoginPayload } from '../dtos/login.dto';

@Injectable()
export class AuthService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly authRepository: AuthRepository,
        private readonly userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(AuthService.name);
        this.configService = configService;
    }

    public async getUser(userId: string) {
        const userInfo = await this.userRepository.findOne({
            where: {
                id: userId,
            },
        });
        return userInfo;
    }

    public async getNonce(address: string) {
        const nonce = v4();
        await this.redis.set(`auth-nonce:${address}`, nonce, 'EX', 60);
        return nonce;
    }

    public async login(userId: string) {
        const token = await this.generateToken(userId);
        return token;
    }

    public async refresh(userId: string, fingerprint: string) {
        const token = await this.generateToken(userId, fingerprint);
        return token;
    }

    public async authenticateEmail(email: string, password: string) {
        // TODO: implement login with email
        return '0';
    }

    public async authenticateWallet(address: string, signature: string) {
        const nonce = await this.redis.get(`auth-nonce:${address}`);
        if (!nonce) {
            throw new BadRequestException('Nonce not found');
        }
        await this.redis.del(`auth-nonce:${address}`);

        const verified = await verifySignature(address, nonce, signature);
        if (!verified) {
            throw new BadRequestException('Failed to verify signature');
        }

        const authInfo = await this.authRepository.findOneBy({
            address,
            isActive: true,
        });

        return authInfo?.userId;
    }

    public async register(type: AuthType, payload: WalletLoginPayload) {
        let userInfo: UserEntity;

        switch (type) {
            case AuthType.Email: {
                // eslint-disable-next-line no-empty-pattern
                const {} = payload;
                break;
            }
            case AuthType.Wallet:
                userInfo = await this.registerWallet(payload as WalletLoginPayload);
                break;
        }

        const token = await this.generateToken(userInfo.id);
        return token;
    }

    private async registerEmail(payload: EmailLoginPayload) {
        return {};
    }

    private async registerWallet(payload: WalletLoginPayload) {
        const { address, signature } = payload;

        let authInfo = await this.authRepository.findOneBy({
            address,
        });

        if (authInfo) {
            throw new BadRequestException('Authentication info exists');
        }

        const userInfo = this.userRepository.create({
            address,
            balance: 0n,
            username: address,
        });

        authInfo = this.authRepository.create({
            userId: userInfo.id,
            address,
            isActive: true,
            type: AuthType.Wallet,
        });

        await this.authRepository.manager.transaction(async manager => {
            await manager.save(userInfo);
            await manager.save(authInfo);
        });

        return userInfo;
    }

    private async generateToken(userId: string, oldFingerprint?: string) {
        // TODO: implement refresh token fingerprint based on ip, etc
        const newFingerprint = v4();

        const [accessToken, refreshToken] = await Promise.all([
            await this.jwtService.signAsync({ userId } as JwtPayload),
            await this.jwtService.signAsync(
                {
                    userId,
                    fingerprint: newFingerprint,
                } as RefreshJwtPayload,
                {
                    ...jwtRefreshConfig,
                },
            ),
        ]);
        if (oldFingerprint) {
            await this.validateRefreshToken(userId, oldFingerprint);
            await this.redis.hdel(`auth-refresh:${userId}`, oldFingerprint);
        }
        await this.redis.hset(`auth-refresh:${userId}`, newFingerprint, '1');

        return {
            accessToken,
            refreshToken,
        };
    }

    public async validateRefreshToken(userId: string, fingerprint: string) {
        const a = await this.redis.hget(`auth-refresh:${userId}`, fingerprint);

        if (a !== '1') {
            throw new UnauthorizedException();
        }
    }
}
