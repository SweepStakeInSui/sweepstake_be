import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';

import { EEnvKey } from '@constants/env.constant';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env`,
            validationSchema: Joi.object({
                // nestjs
                [EEnvKey.NODE_ENV]: Joi.string().valid('development', 'production'),
                [EEnvKey.PORT]: Joi.number().default(3000),
                [EEnvKey.GLOBAL_PREFIX]: Joi.string(),
                [EEnvKey.SWAGGER_PATH]: Joi.string(),
                [EEnvKey.JWT_EXPIRE]: Joi.number().default(86400),
            }),
            load: [],
        }),
    ],
    providers: [ConfigService],
    exports: [ConfigService],
})
export class ConfigurationModule {}
