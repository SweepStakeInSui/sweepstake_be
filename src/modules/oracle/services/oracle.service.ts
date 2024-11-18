import { LoggerService } from '@shared/modules/loggers/logger.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { ethers } from 'ethers';
import { EEnvKey } from '@constants/env.constant';
import { abi } from '@modules/oracle/abi/abi';
import { OracleRepository } from '@models/repositories/oracle.repository';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RewardService } from '@modules/oracle/services/reward.service';

export class OracleService {
    protected logger: Logger;
    protected configService: ConfigService;

    /// Oracle Part
    private sweepstakeUmaAddress: string = '0xa3bc296E9d18DB4c15700f80849ec518cFdb99e6';
    private umaClient: any;
    private sweepstakeUmaContract: any;
    private sweepstakeUmaIterface: any;
    private rpcProvider = new ethers.JsonRpcProvider('https://polygon-amoy.blockpi.network/v1/rpc/public');

    constructor(
        protected loggerService: LoggerService,
        protected jwtService: JwtService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly oracleRepository: OracleRepository,
        private readonly rewardService: RewardService,

        @InjectQueue('market') private readonly marketQueue: Queue,
    ) {
        this.logger = this.loggerService.getLogger(OracleService.name);
        this.configService = configService;

        this.umaClient = new ethers.Wallet(
            this.configService.get(EEnvKey.ADMIN_PRIVATE_KEY_AMOY),
            new ethers.JsonRpcProvider('https://polygon-amoy.blockpi.network/v1/rpc/public'),
        );
        this.sweepstakeUmaContract = new ethers.Contract(this.sweepstakeUmaAddress, abi, this.umaClient);
        this.sweepstakeUmaIterface = new ethers.Interface(abi);
    }

    /// Oracle Uma Part
    public async requestData(
        creator: string,
        marketId: string,
        // description of the market is the ancillary string
        ancillaryString: string,
    ) {
        const oracleEntity = await this.oracleRepository.findOneBy({ marketId });
        const questionId = oracleEntity.questionId;
        try {
            const tx = await this.sweepstakeUmaContract.requestData(creator, marketId, ancillaryString);
            oracleEntity.requestHash = tx.hash;
            await this.oracleRepository.save(oracleEntity);

            //Job check the market state
            await this.marketQueue.add(
                'checkMarketState',
                { questionId },
                // Todo: adjust the delay time
                { delay: 60000 },
            );
        } catch (e) {
            console.error(e);
        }
    }

    public async settleData(questionId: string) {
        const oracleEntity = await this.oracleRepository.findOneBy({ questionId });
        try {
            const tx = await this.sweepstakeUmaContract.settleRequest(questionId);
            oracleEntity.settleHash = tx.hash;
            oracleEntity.winner = await this.getSettledData(questionId);
            await this.oracleRepository.save(oracleEntity);
            await this.rewardService.syncReward(oracleEntity.marketId);
        } catch (e) {
            console.error(e);
        }
    }

    public async getSettledData(questionId: string): Promise<boolean> {
        const settledData = await this.sweepstakeUmaContract.getSettledData(questionId);
        return settledData == '1000000000000000000';
    }

    public async getWinner(marketId: string) {
        const oracleEntity = await this.oracleRepository.findOneBy({ marketId });
        return oracleEntity.winner;
    }

    public async getQuestionInitializedEventByTxHash(txHash: string) {
        const receipt = await this.rpcProvider.getTransactionReceipt(txHash);
        receipt.logs.forEach(log => {
            try {
                const parsedLog = this.sweepstakeUmaIterface.parseLog(log);
                if (parsedLog.name === 'QuestionInitialized') {
                    return parsedLog.args[0];
                }
            } catch (e) {
                console.error(e);
            }
        });
    }

    public async getQuestionIdByMarketId(marketId: string) {
        const oracleEntity = await this.oracleRepository.findOneBy({ marketId });
        return oracleEntity.questionId;
    }

    public async getQuestionData(questionID) {
        const questionData = await this.sweepstakeUmaContract.questions(questionID);
        return questionData.ancillaryData;
    }

    public async getSateData(questionID) {
        return await this.sweepstakeUmaContract.getSateData(questionID);
    }

    public async buildSetLivenessTransaction(liveness: string) {
        const tx = await this.sweepstakeUmaContract.setLiveness(liveness);
        return tx.hash;
    }

    public calculateQuestionId(ancillaryString: string) {
        return ethers.keccak256(ethers.toUtf8Bytes(ancillaryString));
    }
}
