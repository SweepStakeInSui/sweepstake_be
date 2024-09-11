import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainService } from './services/chain.service';
import { TransactionService } from './services/transaction.service';
import { NonceManagerService } from './services/nonce-manager.service';

const services = [ChainService, TransactionService, NonceManagerService];

@Module({
    imports: [TypeOrmModule.forFeature([])],
    controllers: [],
    providers: [...services],
    exports: [...services],
})
export class ChainModule {}
