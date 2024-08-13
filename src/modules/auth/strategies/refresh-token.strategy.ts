import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtRefreshConfig } from '@config/jwt.config';
import { StrategyType } from '../types/strategy';
import { AuthService } from '../services/auth.service';
import { RefreshJwtPayload } from '../types/jwt-payload';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, StrategyType.RefreshToken) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtRefreshConfig.secret,
            ignoreExpiration: false,
            // passReqToCallback: true,
        });
    }

    async validate(payload: RefreshJwtPayload) {
        const user = await this.authService.getUser(payload.userId);
        if (!user) {
            throw new UnauthorizedException();
        }
        return payload;
    }
}
