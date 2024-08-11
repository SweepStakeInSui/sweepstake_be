import { jwtConfig } from '@config/jwt.config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'access') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtConfig.secret,
            ignoreExpiration: false,
        });
    }

    validate(payload: JwtPayload) {
        return { userId: payload.userId };
    }
}
