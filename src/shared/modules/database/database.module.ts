import { Entities } from '@models/entities';
import { Repositories } from '@models/repositories';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([...Entities, ...Repositories])],
    exports: [TypeOrmModule],
})
export class DatabaseModule {}
