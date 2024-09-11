import { TransactionEntity } from '@models/entities/transaction.entity';
import { ChainRepository } from '@models/repositories/chain.repository';
import { TransactionRepository } from '@models/repositories/transaction.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionService {
    constructor(
        private readonly chainRepository: ChainRepository,
        private readonly transactionRepository: TransactionRepository,
    ) {}

    public async getTransactionByHash(hash: string) {
        // TODO: get tx from chain
        console.log('getTransactionByHash', hash);
    }

    public async buildTransaction(transaction: TransactionEntity) {
        console.log(transaction);
    }

    public async submitTransaction(transaction: TransactionEntity) {
        // TODO: submit tx to chain
        const tx = this.transactionRepository.create(transaction);
        await this.transactionRepository.save(tx);
        console.log('submitTransaction', transaction);
    }
}
