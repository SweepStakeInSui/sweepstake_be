import { Module } from '@nestjs/common';
import { MatchingEngineService } from './services/matching-engine.service';

const services = [MatchingEngineService];

@Module({
    imports: [],
    controllers: [],
    providers: [...services],
    exports: [...services],
})
export class MatchingEngineModule {}
