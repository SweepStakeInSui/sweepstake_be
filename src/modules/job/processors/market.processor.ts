import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { OracleService } from '@modules/oracle/services/oracle.service';

@Processor('market')
export class MarketProcessor {
    constructor(private readonly oracleService: OracleService) {}

    @Process('requestData')
    async handleRequestData(job: Job) {
        const { creator, marketId, description } = job.data;
        console.log('requestData', creator, marketId, description);
        try {
            await this.oracleService.requestData(creator, marketId, description);
        } catch (error) {
            error.log('requestData error', error);
            throw error;
        }
    }

    @Process('checkMarketState')
    async handleCheckMarketState(job: Job) {
        const { questionId } = job.data;
        let state;
        try {
            state = await this.oracleService.getSateData(questionId);
        } catch (error) {
            error.log('checkMarketState error', error);
            throw error;
        }
        console.log('question_id', questionId, state);
        if (state.toString() == '3') {
            await job.queue.add('settleRequest', { questionId }, { attempts: 5, backoff: 1000 });
        } else if (state.toString() == '0') {
            return;
        } else {
            // Todo: adjust the delay time
            await job.queue.add('checkMarketState', { questionId }, { delay: 6000, attempts: 5, backoff: 5000 });
        }
    }

    @Process('settleRequest')
    async handleSettleRequest(job: Job) {
        const { questionId } = job.data;
        try {
            await this.oracleService.settleData(questionId);
        } catch (error) {
            error.log('settleRequest error', error);
            throw error;
        }
    }
}
