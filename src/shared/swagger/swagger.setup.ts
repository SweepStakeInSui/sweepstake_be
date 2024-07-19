import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { EEnvKey } from '@constants/env.constant';
import { INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export async function initSwagger(app: INestApplication, config: ConfigService) {
    const swaggerConfig = {
        isPublic: config.get(EEnvKey.SWAGGER_IS_PUBLIC) === 'true',
        title: config.get(EEnvKey.SWAGGER_TITLE),
        description: config.get(EEnvKey.SWAGGER_DESC),
        version: config.get(EEnvKey.SWAGGER_VERSION),
        server: config.get(EEnvKey.SWAGGER_HOST),
        username: config.get(EEnvKey.SWAGGER_USERNAME),
        password: config.get(EEnvKey.SWAGGER_PASSWORD),
    };
    if (!swaggerConfig.isPublic) return;

    const configSwagger = new DocumentBuilder()
        .setTitle(swaggerConfig.title)
        .setDescription(swaggerConfig.description)
        .setVersion(swaggerConfig.version)
        // .addServer(swaggerConfig.server, 'Host')
        .setExternalDoc('Postman Collection', '/docs-json')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'api-key', in: 'header' })
        .build();

    const http_adapter = app.getHttpAdapter();
    http_adapter.use('/docs*', (req: Request, res: Response, next: NextFunction) => {
        function parseAuthHeader(input: string): { name: string; pass: string } {
            const [, encodedPart] = input.split(' ');

            const buff = Buffer.from(encodedPart, 'base64');
            const text = buff.toString('ascii');
            const [name, pass] = text.split(':');

            return { name, pass };
        }

        function unauthorizedResponse(): void {
            res.status(401);
            res.set('WWW-Authenticate', 'Basic');
            res.send('Access denied');
        }

        if (!req.headers.authorization) {
            return unauthorizedResponse();
        }

        const credentials = parseAuthHeader(req.headers.authorization);

        if (credentials?.name !== swaggerConfig.username || credentials?.pass !== swaggerConfig.password) {
            return unauthorizedResponse();
        }

        next();
    });

    const document = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('/docs', app, document);
}
