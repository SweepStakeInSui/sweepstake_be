import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto, WalletLoginPayload } from '../dtos/login.dto';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthType } from '../types/auth';
import { StrategyType } from '../types/strategy';

@Injectable()
export class WalletStrategy extends PassportStrategy(Strategy, StrategyType.Wallet) {
    constructor(private authService: AuthService) {
        super();
    }

    async validate(request: Request) {
        const body = request.body as LoginRequestDto;
        if (body.type !== AuthType.Wallet) {
            throw new BadRequestException();
        }
        const { address, signature } = request.body.payload as WalletLoginPayload;
        const userId = await this.authService.authenticateWallet(address, signature);
        return { userId };
    }
}
