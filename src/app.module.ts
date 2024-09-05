import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { memoryStorage } from 'multer';
import { ConsoleModule } from 'nestjs-console';

import { ConfigurationModule } from '@config/config.module';

import { LoggingModule } from '@shared/modules/loggers/logger.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Modules } from './modules';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from '@config/database.config';
import { RedisModule } from '@songkeys/nestjs-redis';
import { redisOptions } from '@config/redis.config';
import { DatabaseModule } from '@shared/modules/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtOptions } from '@config/jwt.config';
import { KafkaModule } from '@shared/modules/kafka/kafka.module';

@Module({
    imports: [
        EventEmitterModule.forRoot({
            // set this to `true` to use wildcards
            wildcard: false,
            // the delimiter used to segment namespaces
            delimiter: '.',
            // set this to `true` if you want to emit the newListener event
            newListener: false,
            // set this to `true` if you want to emit the removeListener event
            removeListener: false,
            // the maximum amount of listeners that can be assigned to an event
            maxListeners: 10,
            // show event name in memory leak message when more than maximum amount of listeners is assigned
            verboseMemoryLeak: false,
            // disable throwing uncaughtException if an error event is emitted and it has no listeners
            ignoreErrors: false,
        }),
        ConfigurationModule,
        TypeOrmModule.forRootAsync(typeOrmOptions),
        RedisModule.forRootAsync(redisOptions),
        KafkaModule,
        JwtModule.registerAsync(jwtOptions),
        DatabaseModule,
        LoggingModule,
        ConsoleModule,
        MulterModule.register({
            storage: memoryStorage(),
        }),
        ScheduleModule.forRoot(),
        ...Modules,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
