import { ChainRepository } from '@models/repositories/chain.repository';
import { TransactionRepository } from '@models/repositories/transaction.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { GasStationClient, GaslessTransaction, buildGaslessTransaction } from '@shinami/clients/sui';
import { EEnvKey } from '@constants/env.constant';
import { SuiClient } from '@mysten/sui/client';
import { TransactionStatus, TransactionTarget } from '../types/transaction';
import { Keypair } from '@mysten/sui/cryptography';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';

@Injectable()
export class TransactionService {
    protected logger: Logger;
    protected configService: ConfigService;

    private nodeClient: SuiClient;
    private gasClient: GasStationClient;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        private readonly kafkaProducer: KafkaProducerService,

        private readonly chainRepository: ChainRepository,
        private readonly transactionRepository: TransactionRepository,
    ) {
        this.logger = this.loggerService.getLogger(TransactionService.name);
        this.configService = configService;

        this.nodeClient = new SuiClient({ url: EEnvKey.RPC_URL });
        this.gasClient = new GasStationClient(EEnvKey.SHINAMI_ACCESS_KEY);
    }

    public async getTransactionByHash(hash: string) {
        // TODO: get tx from chain
        console.log('getTransactionByHash', hash);
    }

    public async buildTransaction(sender: string, target: TransactionTarget, typeArgs: any[], args: any[]) {
        const gaslessTx = await this.buildGasslessMoveCall(target, typeArgs, args);
        gaslessTx.sender = sender;

        const sponsoredTx = await this.gasClient.sponsorTransaction(gaslessTx);

        const txInfo = this.transactionRepository.create({
            address: sender,
            hash: sponsoredTx.txDigest,
            status: TransactionStatus.Built,
        });

        await this.transactionRepository.save(txInfo);

        return sponsoredTx;
    }

    public async signTransaction(txBytes: Uint8Array, keypair: Keypair) {
        return await keypair.signTransaction(txBytes);
    }

    public async submitTransaction(txHash: string, txData: string | Uint8Array, signature: string[]) {
        const txInfo = await this.transactionRepository.findOneBy({
            hash: txHash,
        });

        if (!txInfo) {
            throw new Error('Transaction not found');
        }

        txInfo.status = TransactionStatus.Sent;

        await this.transactionRepository.save(txInfo);

        const txResp = await this.nodeClient.executeTransactionBlock({
            transactionBlock: txData,
            signature,
        });

        await this.kafkaProducer.produce({
            topic: KafkaTopic.WAIT_TRANSACTION,
            messages: [
                {
                    value: JSON.stringify({
                        hash: txHash,
                    }),
                },
            ],
        });
        return txResp;
    }

    public async waitForTransaction(txHash: string) {
        const txResp = await this.nodeClient.waitForTransaction({
            digest: txHash,
        });
        return txResp;
    }

    private async buildGasslessMoveCall(target: string, typeArgs: any[], args: any[]): Promise<GaslessTransaction> {
        return await buildGaslessTransaction(
            txb => {
                txb.moveCall({
                    target,
                    typeArguments: typeArgs,
                    arguments: args,
                });
            },
            {
                sui: this.nodeClient,
            },
        );
    }
}
