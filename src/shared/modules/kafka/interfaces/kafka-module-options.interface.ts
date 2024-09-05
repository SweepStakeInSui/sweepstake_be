import { ModuleMetadata, Provider, Type } from '@nestjs/common';

export interface KafkaModuleOptions {}
export interface KafkaOptionsFactory {
    createJwtOptions(): Promise<KafkaModuleOptions> | KafkaModuleOptions;
}
export interface KafkaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    global?: boolean;
    useExisting?: Type<KafkaOptionsFactory>;
    useClass?: Type<KafkaOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
    inject?: any[];
    extraProviders?: Provider[];
}
