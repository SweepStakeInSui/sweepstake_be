import { OrderEntity } from '@models/entities/order.entity';
import { OutcomeType } from '@modules/market/types/outcome';
import PriorityQueue from '@modules/order/services/queue';
import { OrderSide, OrderType } from '@modules/order/types/order';
import { BigIntUtil } from '@shared/utils/bigint';
import { log } from 'console';

export type Match = {
    order: OrderEntity;
    matchedOrders: {
        order: OrderEntity;
        amount: bigint;
    }[];
};

export class OrderBook {
    private marketId: string;
    private liquidity: {
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

        this.liquidity['Bid-Yes'] = 0n;
        this.liquidity['Ask-Yes'] = 0n;
        this.liquidity['Bid-No'] = 0n;
        this.liquidity['Ask-No'] = 0n;
    }

    private orderByNonDecreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(a.price - b.price) || a.createdAt - b.createdAt;
    };

    private orderByNonIncreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(b.price - a.price) || a.createdAt - b.createdAt;
    };

    public matchOrder(order: OrderEntity) {
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

        const matches: Match[] = [];

        switch (order.type) {
            case OrderType.FOK:
                this.matchMarketOrder(order, matches);
                break;
            case OrderType.GTC:
            case OrderType.GTD:
                this.matchLimitOrder(order, matches);
                break;
        }

        return matches;
    }

    public cancelOrder(order: OrderEntity) {
        const orderIdx = this.queues[`${order.side}-${order.outcome.type}`].find(item => {
            if (item.id === order.id) return 0;
            if (item.id < order.id) return 1;
            if (item.id > order.id) return -1;
        });

        if (orderIdx !== -1) {
            this.queues[`${order.side}-${order.outcome.type}`].removeIndex(orderIdx);
            this.liquidity[`${order.side}-${order.outcome.type}`] -= order.amount;
        }
    }

    private matchMarketOrder(order: OrderEntity, matches: Match[]) {
        const liquidity =
            this.liquidity[`${order.side === OrderSide.Bid ? OrderSide.Ask : OrderSide.Bid}-${order.outcome.type}`] +
            this.liquidity[
                `${order.side}-${order.outcome.type === OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes}`
            ];

        if (order.amount > liquidity) {
            log('liquidity', liquidity);
            log('Not enough liquidity');

            // cancel the order
            // return matches;
            return;
        }

        // match same asset order
        const sameAssetQueue =
            this.queues[`${order.side === OrderSide.Bid ? OrderSide.Ask : OrderSide.Bid}-${order.outcome.type}`];
        while (!sameAssetQueue.isEmpty() && order.fullfilled < order.amount) {
            const oppositeOrder = sameAssetQueue.peek();
            const matchAmount = BigIntUtil.min(order.amount, oppositeOrder.amount);

            // this.executeTrade(order, oppositeOrder, matchAmount);

            matches.push({ order: order, matchedOrders: [{ order: oppositeOrder, amount: matchAmount }] });

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

            // this.executeTrade(order, oppositeOrder, matchAmount);

            matches.push({ order: order, matchedOrders: [{ order: oppositeOrder, amount: matchAmount }] });

            order.fullfilled += matchAmount;
            oppositeOrder.fullfilled += matchAmount;

            if (oppositeOrder.fullfilled === oppositeOrder.amount) crossAssetQueue.dequeue();
            if (order.fullfilled === order.amount) break;
        }

        // return matches;
    }

    private matchLimitOrder(order: OrderEntity, matches: Match[]) {
        this.matchLimitSameOrders(order, matches);
        this.matchLimitCrossOrders(order, matches);
    }

    private matchLimitSameOrders(order: OrderEntity, matches: Match[]): void {
        const side = order.side;
        const oppositeOrders = this.queues[`${side === OrderSide.Bid ? 'Ask' : 'Bid'}-${order.outcome.type}`];

        let comparator;

        switch (order.side) {
            case OrderSide.Bid:
                comparator = (o1: OrderEntity, o2: OrderEntity) => {
                    o1.price >= o2.price;
                };
                break;
            case OrderSide.Ask:
                comparator = (o1: OrderEntity, o2: OrderEntity) => {
                    o1.price < o2.price;
                };
                break;
        }

        while (!oppositeOrders.isEmpty() && order.fullfilled < order.amount) {
            const oppositeOrder = oppositeOrders.peek();

            if (comparator(order, oppositeOrder)) {
                const matchAmount = BigIntUtil.min(
                    order.amount - order.fullfilled,
                    oppositeOrder.amount - oppositeOrder.fullfilled,
                );

                log(`matched ${order.side} limit`);
                matches.push({ order: order, matchedOrders: [{ order: oppositeOrder, amount: matchAmount }] });
                // this.executeTrade(order, oppositeOrder, matchAmount);

                order.fullfilled += matchAmount;
                oppositeOrder.fullfilled += matchAmount;

                if (oppositeOrder.fullfilled === oppositeOrder.amount) oppositeOrders.dequeue();
                if (order.fullfilled === order.amount) break;
            } else {
                break;
            }
        }

        if (order.fullfilled < order.amount) {
            this.queues[`${order.side}-${order.outcome.type}`].enqueue(order);
            this.liquidity[`${order.side}-${order.outcome.type}`] += order.amount;
        }
    }

    private matchLimitCrossOrders(order: OrderEntity, matches: Match[]): void {
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
                matches.push({ order: order, matchedOrders: [{ order: matchedOrder, amount: matchAmount }] });
                // this.executeTrade(matchedOrder, order, matchAmount);

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
    }
}
