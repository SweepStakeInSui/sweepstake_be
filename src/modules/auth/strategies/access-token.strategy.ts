import { jwtConfig } from '@config/jwt.config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload';
import { AuthService } from '../services/auth.service';
import { StrategyType } from '../types/strategy';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, StrategyType.AccessToken) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtConfig.secret,
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.getUser(payload.userId);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
