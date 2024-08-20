import { OrderEntity } from '@models/entities/order.entity';
import { OrderSide, OrderType } from '../../order/types/order';
import PriorityQueue from '../../order/services/queue';
import { log } from 'console';
import { BigIntUtil } from '@shared/utils/bigint';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';

export class MatchingEngineService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
    ) {
        this.logger = this.loggerService.getLogger(MatchingEngineService.name);
        this.configService = configService;

        this.queues['buy-yes'] = new PriorityQueue<OrderEntity>(this.orderByNonIncreasing);
        this.queues['sell-yes'] = new PriorityQueue<OrderEntity>(this.orderByNonDecreasing);
        this.queues['buy-no'] = new PriorityQueue<OrderEntity>(this.orderByNonIncreasing);
        this.queues['sell-no'] = new PriorityQueue<OrderEntity>(this.orderByNonDecreasing);
    }

    private queues: {
        [key: string]: PriorityQueue<OrderEntity>;
    } = {};

    orderByNonDecreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(a.price - b.price) || a.createdAt - b.createdAt;
    };

    orderByNonIncreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(b.price - a.price) || a.createdAt - b.createdAt;
    };

    search(arr: OrderEntity[], price: bigint) {
        let start = 0;
        let end = arr.length - 1;

        // Iterate while start not meets end
        while (start <= end) {
            // Find the mid index
            const mid = Math.floor((start + end) / 2);

            // If element is present at
            // mid, return True
            if (arr[mid].price === price) return mid;
            // Else look in left or
            // right half accordingly
            else if (arr[mid].price < price) start = mid + 1;
            else end = mid - 1;
        }

        return -1;
    }

    addMarketOrder(order: OrderEntity) {
        const side = order.side === OrderSide.Bid ? 'sell-' : 'buy-';

        const oppositeSide = order.side === OrderSide.Bid ? 'sell-' : 'buy-';
        const key2 = order.outcomeId === '1' ? 'no' : 'no';

        const oppositeOrder = this.queues[`${oppositeSide}${key2}`].peek();

        const currentPrice = oppositeOrder.price;
        order.price = currentPrice;

        this.queues[`${side}${key2}`].enqueue(order);
    }

    addLimitOrder(order: OrderEntity) {
        const key1 = order.side === OrderSide.Bid ? 'buy-' : 'sell-';
        const key2 = order.outcomeId === '1' ? 'yes' : 'no';
        this.queues[`${key1}${key2}`].enqueue(order);
    }

    addOrder(order: OrderEntity): void {
        if (order.type === OrderType.FOK) {
            this.addMarketOrder(order);
        } else {
            this.addLimitOrder(order);
        }

        log('added order', order);

        Object.entries(this.queues).map(([key, queue]) => {
            log(
                key,
                queue.toArray().map(o => {
                    return {
                        id: o.id,
                        outcomeId: o.outcomeId,
                        price: o.price,
                        amount: o.amount,
                    };
                }),
            );
        });

        this.matchOrders();
    }

    private matchOrders(): void {
        this.matchSameAssetOrders('yes');
        this.matchSameAssetOrders('no');
        this.matchCrossAssetOrders(this.queues['buy-yes'], this.queues['buy-no']);
        this.matchCrossAssetOrders(this.queues['buy-no'], this.queues['buy-yes']);
        this.matchCrossAssetOrders(this.queues['sell-yes'], this.queues['sell-no']);
        this.matchCrossAssetOrders(this.queues['sell-no'], this.queues['sell-yes']);
    }

    private matchSameAssetOrders(side: string): void {
        const buyOrders = this.queues[`buy-${side}`];
        const sellOrders = this.queues[`sell-${side}`];

        while (!buyOrders.isEmpty() && !sellOrders.isEmpty()) {
            const buyOrder = buyOrders.peek();
            const sellOrder = sellOrders.peek();

            if (buyOrder.price >= sellOrder.price) {
                const matchamount = BigIntUtil.min(buyOrder.amount, sellOrder.amount);

                log('matched same asset');
                this.executeTrade(buyOrder, sellOrder, matchamount);

                buyOrder.amount -= matchamount;
                sellOrder.amount -= matchamount;

                if (buyOrder.amount === 0n) buyOrders.dequeue();
                if (sellOrder.amount === 0n) sellOrders.dequeue();
            } else {
                break;
            }
        }
    }

    private matchCrossAssetOrders(queue: PriorityQueue<OrderEntity>, oppQueue: PriorityQueue<OrderEntity>): void {
        while (!queue.isEmpty()) {
            const yesBuyOrders = oppQueue.toArray();

            const firstBuyNoOrder = queue.peek();
            const matchedOrderIdx = this.search(yesBuyOrders, 1000n - firstBuyNoOrder.price);

            if (matchedOrderIdx !== -1) {
                const matchamount = BigIntUtil.min(yesBuyOrders[matchedOrderIdx].amount, firstBuyNoOrder.amount);

                log('matched cross asset');
                this.executeTrade(yesBuyOrders[matchedOrderIdx], firstBuyNoOrder, matchamount);

                yesBuyOrders[matchedOrderIdx].amount -= matchamount;
                firstBuyNoOrder.amount -= matchamount;

                if (yesBuyOrders[matchedOrderIdx].amount === 0n) oppQueue.removeIndex(matchedOrderIdx);
                if (firstBuyNoOrder.amount === 0n) queue.dequeue();
            } else {
                break;
            }
        }
    }

    private executeTrade(order1: OrderEntity, order2: OrderEntity, amount: bigint): void {
        console.log(`Trade executed: ${amount} units between Order ${order1.id} and Order ${order2.id}`);
    }
}
