import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto, WalletLoginPayload } from '../dtos/login.dto';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthType } from '../types/auth';

@Injectable()
export class WalletStrategy extends PassportStrategy(Strategy, 'wallet') {
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
