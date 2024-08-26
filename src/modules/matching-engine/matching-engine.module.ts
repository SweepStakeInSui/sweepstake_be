import { Module } from '@nestjs/common';
import { MatchingEngineService } from './services/matching-engine.service';

const controllers = [];
const services = [MatchingEngineService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
    exports: [...services],
})
export class MatchingEngineModule {}
