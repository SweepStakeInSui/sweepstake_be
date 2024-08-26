import { OrderEntity } from '@models/entities/order.entity';
import { OutcomeType } from '@modules/market/types/outcome';
import PriorityQueue from '@modules/order/services/queue';
import { OrderSide, OrderType } from '@modules/order/types/order';
import { BigIntUtil } from '@shared/utils/bigint';
import { log } from 'console';

export class OrderProcessor {
    private marketId: string;
    private price: {
        [key: string]: bigint;
    } = {};

    private queues: {
        [key: string]: PriorityQueue<OrderEntity>;
    } = {};

    constructor(marketId: string) {
        this.marketId = marketId;

        this.queues['Bid-Yes'] = new PriorityQueue<OrderEntity>(this.orderByNonIncreasing);
        this.queues['Ask-Yes'] = new PriorityQueue<OrderEntity>(this.orderByNonDecreasing);
        this.queues['Bid-No'] = new PriorityQueue<OrderEntity>(this.orderByNonIncreasing);
        this.queues['Ask-No'] = new PriorityQueue<OrderEntity>(this.orderByNonDecreasing);

        this.price['Bid-Yes'] = 0n;
        this.price['Ask-Yes'] = 0n;
        this.price['Bid-No'] = 0n;
        this.price['Ask-No'] = 0n;
    }

    private orderByNonDecreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(a.price - b.price) || a.createdAt - b.createdAt;
    };

    private orderByNonIncreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(b.price - a.price) || a.createdAt - b.createdAt;
    };

    addOrder(order: OrderEntity) {
        Object.entries(this.queues).map(([key, queue]) => {
            log(
                key,
                queue.toArray().map(o => {
                    return {
                        id: o.id,
                        outcomeId: o.outcomeId,
                        price: o.price,
                        amount: o.amount,
                        fullfilled: o.fullfilled,
                    };
                }),
            );
        });

        this.matchOrder(order);
    }

    matchOrder(order: OrderEntity) {
        switch (order.type) {
            case OrderType.FOK:
                this.matchMarketOrder(order);
                break;
            case OrderType.GTC:
            case OrderType.GTD:
                this.matchLimitOrder(order);
                break;
        }
    }

    private matchMarketOrder(order: OrderEntity) {
        const liquidity =
            this.price[`${order.side === OrderSide.Bid ? OrderSide.Ask : OrderSide.Bid}-${order.outcome.type}`] +
            this.price[`${order.side}-${order.outcome.type === OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes}`];

        if (order.amount > liquidity) {
            log('liquidity', liquidity);
            log('Not enough liquidity');

            // cancel the order
            return;
        }

        // match same asset order
        const sameAssetQueue =
            this.queues[`${order.side === OrderSide.Bid ? OrderSide.Ask : OrderSide.Bid}-${order.outcome.type}`];
        while (!sameAssetQueue.isEmpty() && order.fullfilled < order.amount) {
            const oppositeOrder = sameAssetQueue.peek();
            const matchAmount = BigIntUtil.min(order.amount, oppositeOrder.amount);

            this.executeTrade(order, oppositeOrder, matchAmount);

            order.fullfilled += matchAmount;
            oppositeOrder.fullfilled += matchAmount;

            if (oppositeOrder.fullfilled === oppositeOrder.amount) sameAssetQueue.dequeue();
            if (order.fullfilled === order.amount) break;
        }

        // match cross asset order

        const crossAssetQueue =
            this.queues[`${order.side}-${order.outcome.type === OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes}`];
        while (!crossAssetQueue.isEmpty() && order.fullfilled < order.amount) {
            const oppositeOrder = crossAssetQueue.peek();
            const matchAmount = BigIntUtil.min(order.amount, oppositeOrder.amount);

            this.executeTrade(order, oppositeOrder, matchAmount);

            order.fullfilled += matchAmount;
            oppositeOrder.fullfilled += matchAmount;

            if (oppositeOrder.fullfilled === oppositeOrder.amount) crossAssetQueue.dequeue();
            if (order.fullfilled === order.amount) break;
        }
    }

    private matchLimitOrder(order: OrderEntity) {
        this.matchSameAssetOrders(order);
        this.matchCrossAssetOrders(order);
    }

    private matchSameAssetOrders(order: OrderEntity): void {
        const side = order.side;
        const oppositeQueue = this.queues[`${side === OrderSide.Bid ? 'Ask' : 'Bid'}-${order.outcome.type}`];

        switch (order.side) {
            case OrderSide.Bid:
                this.matchBidLimitOrder(order, oppositeQueue);
                break;
            case OrderSide.Ask:
                this.matchAskLimitOrder(order, oppositeQueue);
                break;
        }
    }

    private matchBidLimitOrder(order: OrderEntity, askOrders: PriorityQueue<OrderEntity>) {
        while (!askOrders.isEmpty() && order.fullfilled < order.amount) {
            const askOrder = askOrders.peek();

            if (order.price >= askOrder.price) {
                const matchAmount = BigIntUtil.min(
                    order.amount - order.fullfilled,
                    askOrder.amount - askOrder.fullfilled,
                );

                log('matched bid limit');
                this.executeTrade(order, askOrder, matchAmount);

                order.fullfilled += matchAmount;
                askOrder.fullfilled += matchAmount;

                if (askOrder.fullfilled === askOrder.amount) askOrders.dequeue();
                if (order.fullfilled === order.amount) break;
            } else {
                break;
            }
        }

        if (order.fullfilled < order.amount) {
            this.queues[`${order.side}-${order.outcome.type}`].enqueue(order);

            this.price[`${order.side}-${order.outcome.type}`] += order.amount;
        }
    }

    private matchAskLimitOrder(order: OrderEntity, bidOrders: PriorityQueue<OrderEntity>) {
        while (!bidOrders.isEmpty() && order.fullfilled < order.amount) {
            const bidOrder = bidOrders.peek();

            if (order.price <= bidOrder.price) {
                const matchAmount = BigIntUtil.min(
                    order.amount - order.fullfilled,
                    bidOrder.amount - bidOrder.fullfilled,
                );

                log('matched ask limit');
                this.executeTrade(bidOrder, order, matchAmount);

                order.fullfilled += matchAmount;
                bidOrder.fullfilled += matchAmount;

                if (bidOrder.fullfilled === bidOrder.amount) bidOrders.dequeue();
                if (order.amount === order.amount) break;
            } else {
                break;
            }
        }

        if (order.fullfilled < order.amount) {
            this.queues[`${order.side}-${order.outcome.type}`].enqueue(order);

            this.price[`${order.side}-${order.outcome.type}`] += order.amount;
        }
    }

    private matchCrossAssetOrders(order: OrderEntity): void {
        const oppQueue =
            this.queues[`${order.side}-${order.outcome.type === OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes}`];

        while (!oppQueue.isEmpty() && order.fullfilled < order.amount) {
            let comparator;

            switch (order.side) {
                case OrderSide.Bid:
                    // comparator for bid order, descending
                    comparator = (item: OrderEntity) => {
                        if (item.price === 1000n - order.price) return 0;
                        if (item.price < 1000n - order.price) return 1;
                        if (item.price > 1000n - order.price) return -1;
                    };
                    break;
                case OrderSide.Ask:
                    // comparator for ask order, ascending
                    comparator = (item: OrderEntity) => {
                        if (item.price === 1000n - order.price) return 0;
                        if (item.price < 1000n - order.price) return 1;
                        if (item.price > 1000n - order.price) return -1;
                    };
                    break;
            }

            const matchedOrderIdx = oppQueue.find(comparator);

            const matchedOrder = oppQueue.get(matchedOrderIdx);

            if (matchedOrder) {
                const matchAmount = BigIntUtil.min(
                    matchedOrder.amount - matchedOrder.fullfilled,
                    order.amount - order.fullfilled,
                );

                log('matched cross asset');
                this.executeTrade(matchedOrder, order, matchAmount);

                matchedOrder.fullfilled += matchAmount;
                order.fullfilled += matchAmount;

                if (matchedOrder.fullfilled === matchedOrder.amount) oppQueue.removeIndex(matchedOrderIdx);
                if (order.fullfilled === order.amount) break;
            } else {
                break;
            }
        }
    }

    private executeTrade(order1: OrderEntity, order2: OrderEntity, amount: bigint): void {
        console.log(`Trade executed: ${amount} units between Order ${order1.id} and Order ${order2.id}`);

        // TODO: push to job
    }
}
