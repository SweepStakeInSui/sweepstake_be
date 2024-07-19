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

export const jwtConfig = getJwtConfig(configService);

export const defaultConfig = {
    ...jwtConfig,
};

export const jwtOptions: JwtModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: () =>
        ({
            global: true,
            secret: defaultConfig.secret,
            signOptions: { expiresIn: defaultConfig.expiresIn },
        }) as JwtModuleOptions,
    global: true,
};
