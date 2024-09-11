import { Injectable } from '@nestjs/common';
import { ChainService } from './chain.service';

@Injectable()
export class NonceManagerService {
    constructor(private readonly chainService: ChainService) {}

    public async getNonce(address: string) {
        console.log('getNonce', address);
    }
}
