import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { EEnvKey } from '@constants/env.constant';

import { ResponseTransformInterceptor } from '@shared/interceptors/request-response.interceptor';
import { useMorgan } from '@shared/middleware';
import { HttpExceptionFilter } from '@shared/middleware/http-exception.filter';
import { UnknownExceptionsFilter } from '@shared/middleware/unknown-exceptions.filter';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { BodyValidationPipe } from '@shared/pipes/validation.pipe';
import { initSwagger } from '@shared/swagger';

import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';

import '@shared/utils/bigint';
import { join } from 'path';

export async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
    });
    const configService = app.get(ConfigService);
    const loggingService = app.get(LoggerService);
    const logger = loggingService.getLogger('Main');
    // app.useLogger(logger);
    app.useGlobalInterceptors(new ResponseTransformInterceptor(loggingService));
    app.useGlobalFilters(new UnknownExceptionsFilter(loggingService));
    app.useGlobalFilters(new HttpExceptionFilter(loggingService));

    app.useGlobalPipes(new BodyValidationPipe());
    app.setGlobalPrefix(configService.get<string>(EEnvKey.GLOBAL_PREFIX));
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });
    app.enableCors({
        credentials: true,
    });
    app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
        prefix: '/uploads',
    });
    app.use(useMorgan(loggingService.logger.access));
    await initSwagger(app, configService);
    await app.listen(configService.get<number>(EEnvKey.PORT) || 3000);
    logger.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
