import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { ethers } from 'ethers';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { Redis } from 'ioredis';
import { JwtPayload } from '../types/jwt-payload';
import { AuthType } from '../types/auth';
import { RegisterPayload } from '../dtos/register-request.dto';
import { LoginPayload, WalletLoginPayload } from '../dtos/login-request.dto';

@Injectable()
export class AuthService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
    ) {
        this.logger = this.loggerService.getLogger(AuthService.name);
        this.configService = configService;
    }

    async getNonce(address: string) {
        const nonce = v4();
        await this.redis.set(`login-nonce:${address}`, nonce, 'EX', 60);
        return nonce;
    }

    async login(type: AuthType, payload: LoginPayload) {
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
        // TODOL: implement login with email
        const token = await this.getToken({
            address: email + password,
        });
        return token;
    }

    async loginWithWallet(address: string, signature: string) {
        const nonce = await this.redis.get(`login-nonce:${address}`);
        if (!nonce) {
            throw new BadRequestException('Nonce not found');
        }

        const verified = this.verifySignature(address, nonce, signature);
        if (!verified) {
            throw new BadRequestException('Failed to verify signature');
        }

        const token = await this.getToken({
            address,
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
                break;
        }
    }

    async verifySignature(address: string, message: string, signature: string): Promise<boolean> {
        const recoveredSigner = ethers.recoverAddress(ethers.hashMessage(message), signature);
        if (address !== recoveredSigner) {
            return false;
        }
        return true;
    }

    async getToken(payload: JwtPayload) {
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}
