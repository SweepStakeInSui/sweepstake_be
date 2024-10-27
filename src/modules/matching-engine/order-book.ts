import { OrderEntity } from '@models/entities/order.entity';
import { OutcomeType } from '@modules/market/types/outcome';
import { OrderSide, OrderType } from '@modules/order/types/order';
import { BigIntUtil } from '@shared/utils/bigint';
import { log } from 'console';
import PriorityQueue from '../../shared/utils/queue';
import { Transform, Type } from 'class-transformer';
import { transformBigInt } from '@shared/decorators/transformers/big-int.transformer';

export class Match {
    @Type(() => OrderEntity)
    order: OrderEntity;
    @Type(() => MatchedOrder)
    matchedOrders: MatchedOrder[];
}

export class MatchedOrder {
    @Type(() => OrderEntity)
    order: OrderEntity;
    @Transform(transformBigInt)
    amount: bigint;
    @Transform(transformBigInt)
    price: bigint;
}

export class Liquidity {
    price: bigint;
    amount: bigint;
    side: OrderSide;
    type: OutcomeType;
}

export class OrderBook {
    private unit: bigint;

    private marketId: string;

    private outcomeYesId: string;
    private outcomeNoId: string;

    private yesLiquidities: Map<string, bigint> = new Map();
    private noLiquidities: Map<string, bigint> = new Map();

    private price: {
        [key: string]: bigint;
    } = {};

    private liquidities: Map<string, bigint> = new Map();

    // private liquidities: {
    //     [key: string]: bigint;
    // } = {};

    private queues: {
        [key: string]: PriorityQueue<OrderEntity>;
    } = {};

    constructor(marketId: string, decimals: bigint) {
        this.marketId = marketId;
        this.unit = 10n ** decimals;

        // this.outcomeYesId = outcomeYesId;
        // this.outcomeNoId = outcomeNoId;

        this.queues['Bid-Yes'] = new PriorityQueue<OrderEntity>(this.orderByNonIncreasing);
        this.queues['Ask-Yes'] = new PriorityQueue<OrderEntity>(this.orderByNonDecreasing);
        this.queues['Bid-No'] = new PriorityQueue<OrderEntity>(this.orderByNonIncreasing);
        this.queues['Ask-No'] = new PriorityQueue<OrderEntity>(this.orderByNonDecreasing);

        this.liquidities = new Map();

        this.liquidities['Bid-Yes'] = 0n;
        this.liquidities['Ask-Yes'] = 0n;
        this.liquidities['Bid-No'] = 0n;
        this.liquidities['Ask-No'] = 0n;

        // this.volumes['Bid-Yes'] = 0n;
        // this.volumes['Ask-Yes'] = 0n;
        // this.volumes['Bid-No'] = 0n;
        // this.volumes['Ask-No'] = 0n;

        this.updatePrice();
    }

    private updatePrice() {
        this.price['Bid-Yes'] = this.queues['Bid-Yes'].isEmpty() ? 0n : this.queues['Bid-Yes'].peek().price;
        this.price['Ask-Yes'] = this.queues['Ask-Yes'].isEmpty() ? 0n : this.queues['Ask-Yes'].peek().price;
        this.price['Bid-No'] = this.queues['Bid-No'].isEmpty() ? 0n : this.queues['Bid-No'].peek().price;
        this.price['Ask-No'] = this.queues['Ask-No'].isEmpty() ? 0n : this.queues['Ask-No'].peek().price;
    }

    public getPrice() {
        return this.price;
    }

    public getOrderBook() {
        return this.liquidities;
    }

    private orderByNonDecreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(a.price - b.price) || a.createdAt - b.createdAt;
    };

    private orderByNonIncreasing = (a: OrderEntity, b: OrderEntity) => {
        return Number(b.price - a.price) || a.createdAt - b.createdAt;
    };

    public matchOrder(order: OrderEntity) {
        let matches: Match;

        switch (order.type) {
            case OrderType.FOK:
                matches = this.matchMarketOrder(order);
                break;
            case OrderType.GTC:
            case OrderType.GTD:
                matches = this.matchLimitOrder(order);
                break;
        }
        this.updatePrice();
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
            this.liquidities[`${order.side}-${order.outcome.type}`] -= order.amount;
        }
    }

    private addOrder(order: OrderEntity) {
        this.queues[`${order.side}-${order.outcome.type}`].enqueue(order);
        this.addLiquidity(order.side, order.outcome.type, order.price, order.amount);
    }

    private addLiquidity(side: OrderSide, type: OutcomeType, price: bigint, amount: bigint) {
        if (!this.liquidities[`${side}-${type}-${price}`]) {
            this.liquidities[`${side}-${type}-${price}`] = 0n;
        }
        this.liquidities[`${side}-${type}-${price}`] += amount;
        this.liquidities[`${side}-${type}`] += amount;
    }

    private removeLiquidity(side: OrderSide, type: OutcomeType, price: bigint, amount: bigint) {
        this.liquidities[`${side}-${type}-${price}`] -= amount;
        this.liquidities[`${side}-${type}`] -= amount;
    }
    private matchMarketOrder(order: OrderEntity) {
        const matches: Match = {
            order: order,
            matchedOrders: [],
        };
        const liquidity =
            this.liquidities[`${order.side === OrderSide.Bid ? OrderSide.Ask : OrderSide.Bid}-${order.outcome.type}`] +
            this.liquidities[
                `${order.side}-${order.outcome.type === OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes}`
            ];

        if (order.amount > liquidity) {
            log('liquidity', liquidity);
            log('Not enough liquidity');

            // cancel the order
            // return matches;
            return matches;
        }

        // match same asset order
        const sameAssetQueue =
            this.queues[`${order.side === OrderSide.Bid ? OrderSide.Ask : OrderSide.Bid}-${order.outcome.type}`];
        while (!sameAssetQueue.isEmpty() && order.fullfilled < order.amount) {
            const oppositeOrder = sameAssetQueue.peek();

            let exceeded = false;

            switch (order.side) {
                case OrderSide.Bid: {
                    // const maxExpectedPrice = (order.price * (this.unit + order.slippage)) / this.unit;
                    const maxExpectedPrice = (order.price * (1000n + order.slippage)) / 1000n;

                    if (oppositeOrder.price > maxExpectedPrice) exceeded = true;
                    break;
                }
                case OrderSide.Ask: {
                    // const maxExpectedPrice = (order.price * (this.unit - order.slippage)) / this.unit;
                    const maxExpectedPrice = (order.price * (1000n - order.slippage)) / 1000n;

                    if (oppositeOrder.price < maxExpectedPrice) exceeded = true;
                    break;
                }
            }

            // TODO: it's look like IOC order right now, need to change to FOK order by revert the match logic
            if (exceeded) break;

            const matchAmount = BigIntUtil.min(order.amount, oppositeOrder.amount);

            // this.executeTrade(order, oppositeOrder, matchAmount);

            matches.matchedOrders.push({ order: oppositeOrder, amount: matchAmount, price: oppositeOrder.price });
            this.removeLiquidity(oppositeOrder.side, oppositeOrder.outcome.type, oppositeOrder.price, matchAmount);

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

            let exceeded = false;

            switch (order.side) {
                case OrderSide.Bid: {
                    const maxExpectedPrice = (order.price * (1000n + order.slippage)) / 1000n;

                    if (this.unit - oppositeOrder.price > maxExpectedPrice) exceeded = true;
                    break;
                }
                case OrderSide.Ask: {
                    const maxExpectedPrice = (order.price * (1000n - order.slippage)) / 1000n;

                    if (this.unit - oppositeOrder.price < maxExpectedPrice) exceeded = true;
                    break;
                }
            }

            // TODO: it's look like IOC order right now, need to change to FOK order by revert the match logic
            if (exceeded) break;

            const matchAmount = BigIntUtil.min(order.amount, oppositeOrder.amount);

            // this.executeTrade(order, oppositeOrder, matchAmount);

            matches.matchedOrders.push({ order: oppositeOrder, amount: matchAmount, price: oppositeOrder.price });
            this.removeLiquidity(oppositeOrder.side, oppositeOrder.outcome.type, oppositeOrder.price, matchAmount);

            order.fullfilled += matchAmount;
            oppositeOrder.fullfilled += matchAmount;

            if (oppositeOrder.fullfilled === oppositeOrder.amount) crossAssetQueue.dequeue();
            if (order.fullfilled === order.amount) break;
        }

        return matches;
    }

    private matchLimitOrder(order: OrderEntity) {
        const matches: Match = {
            order: order,
            matchedOrders: [],
        };

        this.matchLimitSameOrders(order, matches);
        this.matchLimitCrossOrders(order, matches);

        if (order.fullfilled < order.amount) {
            this.addOrder(order);
        }
        return matches;
    }

    private matchLimitSameOrders(order: OrderEntity, matches: Match): void {
        const side = order.side;
        const oppositeOrders =
            this.queues[`${side === OrderSide.Bid ? OrderSide.Ask : OrderSide.Bid}-${order.outcome.type}`];

        let comparator;

        switch (order.side) {
            case OrderSide.Bid:
                comparator = (o1: OrderEntity, o2: OrderEntity) => {
                    return o1.price >= o2.price;
                };
                break;
            case OrderSide.Ask:
                comparator = (o1: OrderEntity, o2: OrderEntity) => {
                    return o1.price <= o2.price;
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
                const matchedPrice = BigIntUtil.min(order.price, oppositeOrder.price);

                log(`matched ${order.side} limit ${matchAmount}`);

                matches.matchedOrders.push({ order: oppositeOrder, amount: matchAmount, price: matchedPrice });
                this.removeLiquidity(oppositeOrder.side, oppositeOrder.outcome.type, oppositeOrder.price, matchAmount);

                // this.executeTrade(order, oppositeOrder, matchAmount);

                order.fullfilled += matchAmount;
                oppositeOrder.fullfilled += matchAmount;

                if (oppositeOrder.fullfilled === oppositeOrder.amount) oppositeOrders.dequeue();
                if (order.fullfilled === order.amount) break;
            } else {
                break;
            }
        }
    }

    private matchLimitCrossOrders(order: OrderEntity, matches: Match): void {
        const oppQueue =
            this.queues[`${order.side}-${order.outcome.type === OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes}`];

        while (!oppQueue.isEmpty() && order.fullfilled < order.amount) {
            let comparator;

            switch (order.side) {
                case OrderSide.Bid:
                    // comparator for bid order, descending
                    comparator = (item: OrderEntity) => {
                        if (item.price === this.unit - order.price) return 0;
                        if (item.price < this.unit - order.price) return 1;
                        if (item.price > this.unit - order.price) return -1;
                    };
                    break;
                case OrderSide.Ask:
                    // comparator for ask order, ascending
                    comparator = (item: OrderEntity) => {
                        if (item.price === this.unit - order.price) return 0;
                        if (item.price < this.unit - order.price) return 1;
                        if (item.price > this.unit - order.price) return -1;
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

                matches.matchedOrders.push({ order: matchedOrder, amount: matchAmount, price: order.price });
                this.removeLiquidity(matchedOrder.side, matchedOrder.outcome.type, matchedOrder.price, matchAmount);

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
