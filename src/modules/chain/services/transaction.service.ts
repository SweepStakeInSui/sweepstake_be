import { ChainRepository } from '@models/repositories/chain.repository';
import { TransactionRepository } from '@models/repositories/transaction.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { GasStationClient, GaslessTransaction, buildGaslessTransaction } from '@shinami/clients/sui';
import { EEnvKey } from '@constants/env.constant';
import { SuiClient } from '@mysten/sui/client';
import { TransactionStatus } from '../types/transaction';
import { decodeSuiPrivateKey, Keypair } from '@mysten/sui/cryptography';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { Transaction } from '@mysten/sui/transactions';
import { buildTransactionTarget } from '@shared/utils/sui';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import dayjs from 'dayjs';

@Injectable()
export class TransactionService {
    protected logger: Logger;
    protected configService: ConfigService;

    private nodeClient: SuiClient;
    private gasClient: GasStationClient;

    private adminKeypair: Ed25519Keypair;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        private readonly kafkaProducer: KafkaProducerService,

        private readonly chainRepository: ChainRepository,
        private readonly transactionRepository: TransactionRepository,
    ) {
        this.logger = this.loggerService.getLogger(TransactionService.name);
        this.configService = configService;

        this.nodeClient = new SuiClient({ url: this.configService.get(EEnvKey.RPC_URL) });
        this.gasClient = new GasStationClient(this.configService.get(EEnvKey.SHINAMI_ACCESS_KEY));
        this.adminKeypair = Ed25519Keypair.fromSecretKey(
            decodeSuiPrivateKey(this.configService.get(EEnvKey.ADMIN_PRIVATE_KEY)).secretKey,
        );
    }

    public getClient() {
        return this.nodeClient;
    }

    public async getTransactionByHash(hash: string) {
        // TODO: get tx from chain
        console.log('getTransactionByHash', hash);
    }

    public async buildGasslessTransaction(sender: string, target: string, typeArgs: any[], args: any[]) {
        const gaslessTx = await this.buildGasslessMoveCall(target, typeArgs, args);
        gaslessTx.sender = sender;

        const sponsoredTx = await this.gasClient.sponsorTransaction(gaslessTx);

        return sponsoredTx;
    }

    public async buildTransaction(
        sender: string,
        target: string,
        typeArgs: any[],
        args: any[],
        options?: {
            gasPrice?: number;
        },
    ) {
        const tx = new Transaction();

        console.log(options);

        tx.moveCall({
            typeArguments: typeArgs,
            arguments: args,
            target,
        });
    }

    public async buildCreateMarketTransaction(
        adminCap: string,
        creator: string,
        name: string,
        description: string,
        condition: string,
        start_time: number,
        end_time: number,
    ) {
        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(adminCap),
                tx.pure.address(creator),
                tx.pure.string(name),
                tx.pure.string(description),
                tx.pure.string(condition),
                tx.pure.u64(dayjs.unix(start_time).valueOf()),
                tx.pure.u64(dayjs.unix(end_time).valueOf()),
            ],
            target: buildTransactionTarget(
                '0x23db3e2dbb0b70af5add9b35f05c9331b27e45ed3f69a977194b2c88af3c10f7',
                'conditional_market',
                'create_market',
            ),
        });
        tx.setGasBudget(10000000);
        tx.setSender(this.adminKeypair.toSuiAddress());

        const txBytes = await tx.build({
            client: this.nodeClient,
        });

        return await this.signTransaction(txBytes, this.adminKeypair);
    }

    public async signTransaction(txBytes: Uint8Array, keypair: Keypair) {
        return await keypair.signTransaction(txBytes);
    }

    public async submitTransaction(txData: string | Uint8Array, signature: string[]) {
        const txResp = await this.nodeClient.executeTransactionBlock({
            transactionBlock: txData,
            signature,
            options: {
                showBalanceChanges: true,
                showEffects: true,
                showEvents: true,
                showInput: true,
                showObjectChanges: true,
                showRawEffects: true,
                showRawInput: true,
            },
        });

        console.log('Transaction submitted: ', txResp);

        const txInfo = this.transactionRepository.create({
            sender: txResp.transaction.data.sender,
            hash: txResp.digest,
            status: TransactionStatus.Sent,
        });

        await this.transactionRepository.save(txInfo);

        await this.kafkaProducer.produce({
            topic: KafkaTopic.WAIT_TRANSACTION,
            messages: [
                {
                    value: JSON.stringify({
                        txHash: txResp.digest,
                    }),
                },
            ],
        });
        return txResp;
    }

    public async waitForTransaction(txHash: string) {
        console.log('waiting : ', txHash);

        const txResp = await this.nodeClient.waitForTransaction({
            digest: txHash,
            options: {
                showBalanceChanges: true,
                showEffects: true,
                showEvents: true,
                showInput: true,
                showObjectChanges: true,
                showRawEffects: true,
                showRawInput: true,
            },
        });

        const txInfo = await this.transactionRepository.findOne({
            where: {
                hash: txHash,
            },
        });

        if (txResp.errors || txResp.effects.status.error) {
            console.log('Transaction failed: ', txResp.errors, txResp.effects.status.error);
            txInfo.status = TransactionStatus.Failed;
        } else {
            txInfo.status = TransactionStatus.Success;
        }

        txInfo.block = txResp.checkpoint;

        await this.transactionRepository.save(txInfo);

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
