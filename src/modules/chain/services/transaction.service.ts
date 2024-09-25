import { ChainRepository } from '@models/repositories/chain.repository';
import { TransactionRepository } from '@models/repositories/transaction.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { GasStationClient, buildGaslessTransaction } from '@shinami/clients/sui';
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
        const tx = await this.nodeClient.getTransactionBlock({
            digest: hash,
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
        console.log('getTransactionByHash', tx);

        return tx;
    }

    public async buildGasslessTransaction(sender: string, tx: Transaction) {
        const gaslessTx = await buildGaslessTransaction(tx, {
            sui: this.nodeClient,
        });
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

    public async buildDepositTransaction(sender: string, amount: bigint) {
        const coinType = buildTransactionTarget('0x2', 'sui', 'SUI');
        const user_coins_id = await this.nodeClient.getCoins({
            owner: sender,
            coinType: coinType,
        });

        const tx = new Transaction();
        const first_coin = user_coins_id.data[0].coinObjectId;
        for (const coin of user_coins_id.data) {
            if (coin.coinObjectId != first_coin) {
                tx.mergeCoins(first_coin, [coin.coinObjectId]);
            }
        }
        const [coin] = tx.splitCoins(
            first_coin, // Get from user
            [tx.pure.u64(amount)],
        );
        tx.moveCall({
            typeArguments: [coinType],
            arguments: [tx.object('0x2cec2a9443fc3983f3d0a6f7570b91051bc210b3f1d84fa792a3bc88245c7975'), coin],
            target: buildTransactionTarget(
                '0xc8174ff02ce888947173e229373fe510ece5f8b0c127791e87c18b8880553c9c',
                'sweepstake',
                'deposit',
            ),
        });
        return tx;
    }

    public async buildWithdrawTransaction(user: string, amount: bigint) {
        const coinType = buildTransactionTarget('0x2', 'sui', 'SUI');
        const adminCap = '0xf4c34ddbc51247d91d8a25c16474f963dfce305772f0c8b8b9469a45a851b5ab';

        const tx = new Transaction();
        tx.moveCall({
            typeArguments: [coinType],
            arguments: [
                tx.object(adminCap),
                tx.object('0x2cec2a9443fc3983f3d0a6f7570b91051bc210b3f1d84fa792a3bc88245c7975'),
                tx.pure.u64(amount),
                tx.pure.address(user),
            ],
            target: buildTransactionTarget(
                '0xc8174ff02ce888947173e229373fe510ece5f8b0c127791e87c18b8880553c9c',
                'sweepstake',
                'withdraw',
            ),
        });

        return tx;
    }

    public async buildCreateMarketTransaction(
        adminCap: string,
        id: string,
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
                tx.pure.string(id),
                tx.pure.address(creator),
                tx.pure.string(name),
                tx.pure.string(description),
                tx.pure.string(condition),
                tx.pure.u64(dayjs.unix(start_time).valueOf()),
                tx.pure.u64(dayjs.unix(end_time).valueOf()),
            ],
            target: buildTransactionTarget(
                '0xc8174ff02ce888947173e229373fe510ece5f8b0c127791e87c18b8880553c9c',
                'conditional_market',
                'create_market',
            ),
        });

        return tx;
    }

    // public async buildTradeTransaction(user: string, amount: bigint) {
    //     const coinType = buildTransactionTarget('0x2', 'sui', 'SUI');
    //     const adminCap = '0xf4c34ddbc51247d91d8a25c16474f963dfce305772f0c8b8b9469a45a851b5ab';

    //     const tx = new Transaction();
    //     tx.moveCall({
    //         typeArguments: [coinType],
    //         arguments: [
    //             tx.object(adminCap),
    //             tx.object('0x2cec2a9443fc3983f3d0a6f7570b91051bc210b3f1d84fa792a3bc88245c7975'),
    //             tx.pure.u64(amount),
    //             tx.pure.address(user),
    //         ],
    //         target: buildTransactionTarget(
    //             '0xc8174ff02ce888947173e229373fe510ece5f8b0c127791e87c18b8880553c9c',
    //             'sweepstake',
    //             'withdraw',
    //         ),
    //     });

    //     return tx;
    // }

    public async signAdminTransaction(tx: Transaction) {
        tx.setGasBudget(10000000);
        tx.setSender(this.adminKeypair.toSuiAddress());

        return await tx.sign({
            signer: this.adminKeypair,
            client: this.nodeClient,
        });
        // return await this.signTransaction(txBytes, this.adminKeypair);
    }

    public async signTransaction(txBytes: Uint8Array, keypair: Keypair) {
        return await keypair.signTransaction(txBytes);
    }

    public async submitTransaction(txData: string | Uint8Array, signature: string[]) {
        // TODO: consider dry-run first

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
}
