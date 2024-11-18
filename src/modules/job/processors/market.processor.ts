import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { OracleService } from '@modules/oracle/services/oracle.service';

@Processor('market')
export class MarketProcessor {
    constructor(private readonly oracleService: OracleService) {}

    @Process('requestData')
    async handleRequestData(job: Job) {
        const { creator, marketId, description } = job.data;
        await this.oracleService.requestData(creator, marketId, description);
    }

    @Process('checkMarketState')
    async handleCheckMarketState(job: Job) {
        const { questionId } = job.data;
        const state = await this.oracleService.getSateData(questionId);
        console.log('question_id', questionId, state);
        if (state.toString() == '3') {
            await this.oracleService.settleData(questionId);
        } else if (state.toString() == '0') {
            return;
        } else {
            // Todo: adjust the delay time
            await job.queue.add('checkMarketState', { questionId }, { delay: 60000 });
        }
    }

    @Process('settleRequest')
    async handleSettleRequest(job: Job) {
        const { questionId } = job.data;
        await this.oracleService.settleData(questionId);
    }
}
