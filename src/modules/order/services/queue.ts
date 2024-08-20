// class PriorityQueue<T> {
//     private heap: T[];
//     private comparator: (a: T, b: T) => boolean;

//     constructor(comparator: (a: T, b: T) => boolean) {
//         this.heap = [];
//         this.comparator = comparator;
//     }

//     public add(item: T): void {
//         this.heap.push(item);
//         this.heapifyUp(this.heap.length - 1);
//     }

//     public extractMax(): T | null {
//         if (this.heap.length === 0) return null;
//         if (this.heap.length === 1) return this.heap.pop() || null;

//         const max = this.heap[0];
//         this.heap[0] = this.heap.pop()!;
//         this.heapifyDown(0);
//         return max;
//     }

//     private heapifyUp(index: number): void {
//         while (index > 0) {
//             const parentIndex = Math.floor((index - 1) / 2);
//             if (this.comparator(this.heap[index], this.heap[parentIndex])) {
//                 [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
//                 index = parentIndex;
//             } else {
//                 break;
//             }
//         }
//     }

//     private heapifyDown(index: number): void {
//         const lastIndex = this.heap.length - 1;
//         while (true) {
//             const leftIndex = index * 2 + 1;
//             const rightIndex = index * 2 + 2;
//             let largestIndex = index;

//             if (leftIndex <= lastIndex && this.comparator(this.heap[leftIndex], this.heap[largestIndex])) {
//                 largestIndex = leftIndex;
//             }

//             if (rightIndex <= lastIndex && this.comparator(this.heap[rightIndex], this.heap[largestIndex])) {
//                 largestIndex = rightIndex;
//             }

//             if (largestIndex !== index) {
//                 [this.heap[index], this.heap[largestIndex]] = [this.heap[largestIndex], this.heap[index]];
//                 index = largestIndex;
//             } else {
//                 break;
//             }
//         }
//     }
// }

// Hàm so sánh cho Priority Queue
// export const orderComparator = (o1: OrderEntity, o2: OrderEntity): boolean => {
//     if (o1.side !== o2.side) {
//         throw new Error('Order side cannot be init queue');
//     }

//     // compare sell order
//     if (o1.side === OrderSide.Ask) {
//         const comparePrice = new BigNumber(o1.price).comparedTo(o2.price);
//         if (comparePrice < 0) return true;
//         if (comparePrice > 0) return false;

//         const compareDate = new Date(o1.updatedAt).getTime() - new Date(o2.updatedAt).getTime();
//         if (compareDate < 0) return true;
//         if (compareDate > 0) return false;

//         return o1.id < o2.id;
//     }

//     // compare buy order
//     if (o1.side === OrderSide.Bid) {
//         const comparePrice = new BigNumber(o1.price).comparedTo(o2.price);
//         if (comparePrice > 0) return true;
//         if (comparePrice < 0) return false;

//         const compareDate = new Date(o1.updatedAt).getTime() - new Date(o2.updatedAt).getTime();
//         if (compareDate < 0) return true;
//         if (compareDate > 0) return false;

//         return o1.id < o2.id;
//     }
// };

// export const initOrdersPriorityQueue = (orders: OrderEntity[]): OrderEntity[] => {
//     const maxHeap = new PriorityQueue<OrderEntity>(orderComparator);

//     orders.forEach(order => maxHeap.add(order));

//     // Extract orders in max-priority order
//     const sortedOrders: OrderEntity[] = [];
//     let order;
//     while ((order = maxHeap.extractMax()) !== null) {
//         sortedOrders.push(order);
//     }
//     return sortedOrders;
// };

// export const addOrderToQueue = (orders: OrderEntity[], newOrder: OrderEntity): OrderEntity[] => {
//     return initOrdersPriorityQueue([...orders, newOrder]);
// };

class PriorityQueue<T> {
    private items: T[];
    private comparator: (a: T, b: T) => number;

    constructor(comparator: (a: T, b: T) => number) {
        this.items = [];
        this.comparator = comparator;
    }

    enqueue(item: T): void {
        this.items.push(item);
        this.items.sort(this.comparator);
    }

    dequeue(): T | undefined {
        return this.items.shift();
    }

    peek(): T | undefined {
        return this.items[0];
    }

    get(index: number): T | undefined {
        if (index < 0 || index >= this.items.length) {
            return undefined;
        }
        return this.items[index];
    }

    toArray(): T[] {
        return [...this.items];
    }

    remove(item: T, predicate: (value: T, index: number, obj: T[]) => unknown): boolean {
        const index = this.items.findIndex(predicate);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    removeIndex(index: number): boolean {
        if (index >= 0) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}

export default PriorityQueue;
