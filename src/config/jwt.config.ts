import { EEnvKey } from '@constants/env.constant';
import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions, JwtModuleOptions } from '@nestjs/jwt';

const configService = new ConfigService();
export interface JwtConfig {
    secret: string;
    expiresIn: string;
}

export function getJwtConfig(configService: ConfigService): JwtConfig {
    return {
        secret: configService.get(EEnvKey.JWT_SECRET),
        expiresIn: `${configService.get(EEnvKey.JWT_EXPIRE)}s`,
    };
}

export function getRefreshJwtConfig(configService: ConfigService): JwtConfig {
    return {
        secret: configService.get(EEnvKey.JWT_SECRET_REFRESH),
        expiresIn: `${configService.get(EEnvKey.JWT_EXPIRE_REFRESH)}s`,
    };
}

export const jwtConfig = getJwtConfig(configService);

export const jwtRefreshConfig = getRefreshJwtConfig(configService);

export const jwtOptions: JwtModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: () =>
        ({
            global: true,
            secret: jwtConfig.secret,
            signOptions: { expiresIn: jwtConfig.expiresIn },
        }) as JwtModuleOptions,
    global: true,
};

export const jwtRefreshOptions: JwtModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: () =>
        ({
            global: true,
            secret: jwtRefreshConfig.secret,
            signOptions: { expiresIn: jwtRefreshConfig.expiresIn },
        }) as JwtModuleOptions,
    global: true,
};
