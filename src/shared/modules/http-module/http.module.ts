import { Global, Module } from '@nestjs/common';
import { HttpConfigService, HttpServiceBase } from '@shared/modules/http-module/http.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
    imports: [
        HttpModule.registerAsync({
            useClass: HttpConfigService,
        }),
    ],
    providers: [HttpServiceBase],
    exports: [HttpModule, HttpServiceBase],
})
export class HttpModuleGlobal {}
