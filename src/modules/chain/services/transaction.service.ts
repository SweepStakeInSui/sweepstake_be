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
import { TransactionTarget } from '@modules/chain/constants/target.constant';

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

    private sweepstakeSuiTreasury: string = '0xdcebb0ff5c3ed92acc59cefd47cf4097178c37036f147733d2bb09ad3e5e0605';
    private sweepstakeAdminCap: string = '0xfb46c0a1cca17e6b0856ae64d9523e645675e7119e727c34df0ed158df0b2c33';
    private conditionalMarketAdminCap: string = '0x4aae3c4cb8827d60f73a633d6c6ecb0256dfb4bc30dfbd80bbb404f3593aceca';

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

        this.sweepstakeSuiTreasury = this.configService.get(EEnvKey.SWEEPSTAKE_SUI_TREASURY);
        this.sweepstakeAdminCap = this.configService.get(EEnvKey.SWEEPSTAKE_ADMIN_CAP);
        this.conditionalMarketAdminCap = this.configService.get(EEnvKey.CONDITIONAL_MARKET_ADMIN_CAP);
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
            target: buildTransactionTarget(
                this.sweepstakeContract,
                TransactionTarget.SweepStake,
                TransactionTarget.Deposit,
            ),
        });
        return tx;
    }

    public async buildWithdrawTransaction(user: string, withdrawId: string, amount: bigint) {
        const coinType = buildTransactionTarget('0x2', 'sui', 'SUI');

        const tx = new Transaction();
        tx.moveCall({
            typeArguments: [coinType],
            arguments: [
                tx.object(this.sweepstakeAdminCap),
                tx.object(this.sweepstakeSuiTreasury),
                tx.pure.string(withdrawId),
                tx.pure.u64(amount),
                tx.pure.address(user),
            ],
            target: buildTransactionTarget(
                this.sweepstakeContract,
                TransactionTarget.SweepStake,
                TransactionTarget.Withdraw,
            ),
        });

        return tx;
    }

    public async buildCreateMarketTransaction(
        id: string,
        creator: string,
        name: string,
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
                tx.pure.string(condition),
                tx.pure.u64(dayjs.unix(start_time).valueOf()),
                tx.pure.u64(dayjs.unix(end_time).valueOf()),
            ],
            target: buildTransactionTarget(
                this.conditionalMarketContract,
                TransactionTarget.Market,
                TransactionTarget.CreateMarket,
            ),
        });

        return tx;
    }

    public async buildExecuteTradeTransaction(
        trades: {
            marketId: string;
            tradeId: string;
            makerOrderId: string;
            maker: string;
            makerAmount: bigint;
            takerOrderId: string;
            taker: string;
            takeAmount: bigint;
            tradeType: number;
            assetType: boolean;
        }[],
    ) {
        const tx = new Transaction();

        for (const trade of trades) {
            const {
                marketId,
                makerOrderId,
                maker,
                makerAmount,
                takerOrderId,
                taker,
                takeAmount,
                tradeType,
                assetType,
            } = trade;

            console.log({
                marketId,
                makerOrderId,
                maker,
                makerAmount,
                takerOrderId,
                taker,
                takeAmount,
                tradeType,
                assetType,
            });

            tx.moveCall({
                arguments: [
                    tx.object(this.conditionalMarketAdminCap),
                    tx.object(marketId),
                    tx.pure.string(makerOrderId),
                    tx.pure.address(maker),
                    tx.pure.u64(makerAmount),
                    tx.pure.string(takerOrderId),
                    tx.pure.address(taker),
                    tx.pure.u64(takeAmount),
                    tx.pure.bool(assetType),
                    tx.pure.u64(tradeType),
                ],
                target: buildTransactionTarget(
                    this.conditionalMarketContract,
                    TransactionTarget.Market,
                    TransactionTarget.ExecuteOrder,
                ),
            });
        }

        return tx;
    }

    public async buildClaimRewardTransaction(id: string, market_id: string, winner: boolean) {
        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(this.conditionalMarketAdminCap),
                tx.object(market_id),
                tx.pure.string(id),
                tx.pure.bool(winner),
            ],
            target: buildTransactionTarget(
                this.conditionalMarketContract,
                TransactionTarget.Market,
                TransactionTarget.ClaimReward,
            ),
        });

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

    // for reward service only
    public async signAdminAndExecuteTransaction(tx: Transaction) {
        tx.setGasBudget(10000000);
        tx.setSender(this.adminKeypair.toSuiAddress());

        await this.rpcClient.signAndExecuteTransaction({
            signer: this.adminKeypair,
            transaction: tx,
        });
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
