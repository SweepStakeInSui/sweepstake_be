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

    // binary search
    find(comparator: (a: T) => number): number | undefined {
        let start = 0;
        let end = this.items.length - 1;

        // Iterate while start not meets end
        while (start <= end) {
            // Find the mid index
            const mid = Math.floor((start + end) / 2);

            const compareResult = comparator(this.items[mid]);

            // If element is present at
            // mid, return True
            if (compareResult === 0) return mid;
            // Else look in left or
            // right half accordingly
            else if (compareResult < 0) start = mid + 1;
            else end = mid - 1;
        }

        return -1;
    }

    remove(predicate: (value: T, index: number, obj: T[]) => unknown): boolean {
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
