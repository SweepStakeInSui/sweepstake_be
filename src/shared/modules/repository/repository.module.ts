import { InvestorRepository } from '@models/repositories/investor.repository';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

const repositories = [InvestorRepository];

@Global()
@Module({
    imports: [TypeOrmModule.forFeature(repositories)],
    exports: [TypeOrmModule],
})
export class RepositoryModule {}
