/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { Redis } from 'ioredis';
import { JwtPayload } from '../types/jwt-payload';
import { AuthType } from '../types/auth';
import { EmailRegisterPayload, RegisterPayload, WalletRegisterPayload } from '../dtos/register-request.dto';
import { LoginPayload, WalletLoginPayload } from '../dtos/login-request.dto';
import { AuthRepository } from '@models/repositories/auth.repository';
// import { verifySignature } from '@shared/utils/ethereum';
import { UserRepository } from '@models/repositories/user.repository';

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

    public async getNonce(address: string) {
        const nonce = v4();
        await this.redis.set(`auth-nonce:${address}`, nonce, 'EX', 60);
        return nonce;
    }

    public async login(type: AuthType, payload: LoginPayload) {
        switch (type) {
            case AuthType.Email:
                break;
            case AuthType.Wallet: {
                const { address, signature } = payload as WalletLoginPayload;
                return this.loginWithWallet(address, signature);
            }
        }
    }

    async loginWithEmail(email: string, password: string) {
        // TODO: implement login with email
        const token = await this.getToken({
            userId: '0',
            address: email + password,
        });
        return token;
    }

    async loginWithWallet(address: string, signature: string) {
        const nonce = await this.redis.get(`auth-nonce:${address}`);
        if (!nonce) {
            throw new BadRequestException('Nonce not found');
        }
        await this.redis.del(`auth-nonce:${address}`);

        // const verified = verifySignature(address, nonce, signature);
        // if (!verified) {
        //     throw new BadRequestException('Failed to verify signature');
        // }

        const authInfo = await this.authRepository.findOneBy({
            address,
            isActive: true,
        });

        if (!authInfo) {
            throw new BadRequestException('Authentication info not found');
        }

        const token = await this.getToken({
            userId: authInfo.userId,
        });
        return token;
    }

    async register(type: AuthType, payload: RegisterPayload) {
        switch (type) {
            case AuthType.Email: {
                // eslint-disable-next-line no-empty-pattern
                const {} = payload;
                break;
            }
            case AuthType.Wallet:
                return await this.registerWallet(payload as WalletRegisterPayload);
        }
    }
    private async registerEmail(payload: EmailRegisterPayload) {
        return {};
    }

    private async registerWallet(payload: WalletRegisterPayload) {
        const { address, signature } = payload;
        const nonce = await this.redis.get(`auth-nonce:${address}`);
        if (!nonce) {
            throw new BadRequestException('Nonce not found');
        }

        // const verified = verifySignature(address, nonce, signature);
        // if (!verified) {
        //     throw new BadRequestException('Failed to verify signature');
        // }

        let authInfo = await this.authRepository.findOneBy({
            address,
        });

        console.log('authInfo', authInfo);

        if (authInfo) {
            throw new BadRequestException('Authentication info exists');
        }

        const userInfo = this.userRepository.create({
            address,
            balance: 0n,
            username: address,
        });

        authInfo = this.authRepository.create({
            address,
            isActive: true,
            type: AuthType.Wallet,
        });

        await this.authRepository.manager.transaction(async manager => {
            await manager.save(userInfo);

            authInfo.userId = userInfo.id;

            await manager.save(authInfo);
        });

        return userInfo;
    }

    async getToken(payload: JwtPayload) {
        return {
            accessToken: await this.jwtService.signAsync(payload),
        };
    }
}
