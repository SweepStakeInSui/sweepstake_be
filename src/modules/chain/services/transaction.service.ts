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
import { SuiGraphQLClient } from '@mysten/sui/graphql';

@Injectable()
export class TransactionService {
    protected logger: Logger;
    protected configService: ConfigService;

    private rpcClient: SuiClient;
    private gqlClient: SuiGraphQLClient;
    private gasClient: GasStationClient;

    private adminKeypair: Ed25519Keypair;

    private sweepstakeContract: string;
    private conditionalMarketContract: string;

    // private sweepstakeSuiTreasury: string = '0x19b2c97b008bb928c0b1591f9fe0ad7443be01c344001e3e4808840f0468fb3e';
    private sweepstakeSuiTreasury: string = '0xe963c8760a403b6e044b2ffaea0f69397610a21bcadabaa7170b8f137a7323fe';
    // private sweepstakeAdminCap: string = '0x7e274946a97f35d2ee35b687c1356509fcf78fa54ac04fa8eabb6cfe2999e6af';
    private sweepstakeAdminCap: string = '0xd9283ceaa0280433a0df326a575135693b0dd915759682752f0f071be1744ff2';
    // private conditionalMarketAdminCap: string = '0x97550e218059081bfbffa7ccca59c5b854ed31c809792e39472a40b01253cc86';
    private conditionalMarketAdminCap: string = '0x6c2b67414c12f6bc8e4ebbdad5e8a5dd98b41f9a6cd3ca5d5fd4b36cabe0abfe';

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        private readonly kafkaProducer: KafkaProducerService,

        private readonly chainRepository: ChainRepository,
        private readonly transactionRepository: TransactionRepository,
    ) {
        this.logger = this.loggerService.getLogger(TransactionService.name);
        this.configService = configService;

        this.rpcClient = new SuiClient({ url: this.configService.get(EEnvKey.RPC_URL) });
        this.gqlClient = new SuiGraphQLClient({ url: this.configService.get(EEnvKey.GQL_URL) });
        this.gasClient = new GasStationClient(this.configService.get(EEnvKey.SHINAMI_ACCESS_KEY));
        this.adminKeypair = Ed25519Keypair.fromSecretKey(
            decodeSuiPrivateKey(this.configService.get(EEnvKey.ADMIN_PRIVATE_KEY)).secretKey,
        );

        this.sweepstakeContract = this.configService.get(EEnvKey.SWEEPSTAKE_CONTRACT);
        this.conditionalMarketContract = this.configService.get(EEnvKey.CONDITIONAL_MARKET_CONTRACT);
    }

    public getRpcClient() {
        return this.rpcClient;
    }

    public getGqlClient() {
        return this.gqlClient;
    }

    public async getTransactionByHash(hash: string) {
        const tx = await this.rpcClient.getTransactionBlock({
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
            sui: this.rpcClient,
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
        const user_coins_id = await this.rpcClient.getCoins({
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
            arguments: [tx.object(this.sweepstakeSuiTreasury), coin],
            target: buildTransactionTarget(this.sweepstakeContract, 'sweepstake', 'deposit'),
        });
        return tx;
    }

    public async buildWithdrawTransaction(user: string, amount: bigint) {
        const coinType = buildTransactionTarget('0x2', 'sui', 'SUI');

        const tx = new Transaction();
        tx.moveCall({
            typeArguments: [coinType],
            arguments: [
                tx.object(this.sweepstakeAdminCap),
                tx.object(this.sweepstakeSuiTreasury),
                tx.pure.u64(amount),
                tx.pure.address(user),
            ],
            target: buildTransactionTarget(this.sweepstakeContract, 'sweepstake', 'withdraw'),
        });

        return tx;
    }

    public async buildCreateMarketTransaction(
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
                tx.object(this.conditionalMarketAdminCap),
                tx.pure.string(id),
                tx.pure.address(creator),
                tx.pure.string(name),
                tx.pure.string(description),
                tx.pure.string(condition),
                tx.pure.u64(dayjs.unix(start_time).valueOf()),
                tx.pure.u64(dayjs.unix(end_time).valueOf()),
            ],
            target: buildTransactionTarget(this.conditionalMarketContract, 'conditional_market', 'create_market'),
        });

        return tx;
    }

    public async buildExecuteTradeTransaction(
        trades: {
            marketId: string;
            tradeId: string;
            maker: string;
            makerAmount: bigint;
            taker: string;
            takeAmount: bigint;
            tradeType: number;
            assetType: boolean;
        }[],
    ) {
        const tx = new Transaction();

        for (const trade of trades) {
            const { marketId, tradeId, maker, makerAmount, taker, takeAmount, tradeType, assetType } = trade;

            tx.moveCall({
                arguments: [
                    tx.object(this.conditionalMarketAdminCap),
                    tx.object(marketId),
                    tx.pure.string(tradeId),
                    tx.pure.address(maker),
                    tx.pure.u64(makerAmount),
                    tx.pure.address(taker),
                    tx.pure.u64(takeAmount),
                    tx.pure.bool(assetType),
                    tx.pure.u64(tradeType),
                ],
                target: buildTransactionTarget(this.conditionalMarketContract, 'conditional_market', 'execute_order'),
            });
        }

        return tx;
    }

    public async signAdminTransaction(tx: Transaction) {
        tx.setGasBudget(10000000);
        tx.setSender(this.adminKeypair.toSuiAddress());

        return await tx.sign({
            signer: this.adminKeypair,
            client: this.rpcClient,
        });
        // return await this.signTransaction(txBytes, this.adminKeypair);
    }

    public async signTransaction(txBytes: Uint8Array, keypair: Keypair) {
        return await keypair.signTransaction(txBytes);
    }

    public async submitTransaction(txData: string | Uint8Array, signature: string[]) {
        // TODO: consider dry-run first

        const txResp = await this.rpcClient.executeTransactionBlock({
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

        const txResp = await this.rpcClient.waitForTransaction({
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

        const events = txResp.events;

        await this.kafkaProducer.produce({
            topic: KafkaTopic.PROCCESS_EVENT,
            messages: [
                {
                    value: JSON.stringify({
                        events,
                    }),
                },
            ],
        });

        txInfo.block = txResp.checkpoint;

        await this.transactionRepository.save(txInfo);

        return txResp;
    }
}
