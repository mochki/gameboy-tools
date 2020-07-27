export type SchedulerCallback = () => void;
export class SchedulerEvent {
    ticks: number;
    callback: SchedulerCallback;

    constructor(ticks: number, callback: SchedulerCallback) {
        this.ticks = ticks;
        this.callback = callback;
    }
}

function parent(n: number) { return Math.floor((n - 1) / 2); }
function leftChild(n: number) { return n * 2 + 1; }
function rightChild(n: number) { return n * 2 + 2; }

export class Scheduler {
    constructor() {
        for (let i = 0; i < 64; i++) {
            this.heap[i] = new SchedulerEvent(0, () => { });
        }
    }

    currTicks = 0;
    currEventTicks = 0;

    heap: SchedulerEvent[] = new Array(64);
    heapSize = 0;

    addEvent(ticks: number, callback: SchedulerCallback) {
        if (this.heapSize >= this.heap.length) {
            alert("Heap overflow!");
        }

        this.heapSize++;
        let index = this.heapSize - 1;
        this.heap[index].ticks = ticks;
        this.heap[index].callback = callback;

        while (index != 0 && this.heap[parent(index)].ticks > this.heap[index].ticks) {
            this.swap(index, parent(index));
            index = parent(index);
        }
        this.updateCurr();
    }

    addEventRelative(ticks: number, callback: SchedulerCallback) {
        this.addEvent(this.currTicks + ticks, callback);
    }

    updateCurr() {
        if (this.heapSize > 0) {
            this.currEventTicks = this.heap[0].ticks;
        }
    }

    getFirstEvent(): SchedulerEvent {
        if (this.heapSize <= 0) {
            alert("Tried to get from empty heap!");
            return this.heap[0]; // This isn't supposed to happen.
        }

        return this.heap[0];
    }

    popFirstEvent(): SchedulerEvent {
        
        if (this.heapSize == 1) {
            this.heapSize--;
            return this.heap[0];
        }
        let event = this.getFirstEvent();

        this.heap[0] = this.heap[--this.heapSize];
        this.minHeapify(0);

        this.updateCurr();
        return event;
    }

    setTicksLower(index: number, newVal: number) {
        this.heap[index].ticks = newVal;

        while (index != 0 && this.heap[parent(index)].ticks > this.heap[index].ticks) {
            this.swap(index, parent(index));
            index = parent(index);
        }
    }

    deleteEvent(index: number) {
        this.setTicksLower(index, -1);
        this.popFirstEvent();
    }

    minHeapify(index: number) {
        let left = leftChild(index);
        let right = rightChild(index);
        let smallest = index;

        if (left < this.heapSize && this.heap[left].ticks < this.heap[index].ticks) {
            smallest = left;
        }
        if (right < this.heapSize && this.heap[right].ticks < this.heap[smallest].ticks) {
            smallest = right;
        }

        if (smallest != index) {
            this.swap(index, smallest);
            this.minHeapify(smallest);
        }
    }

    swap(ix: number, iy: number) {
        let temp = this.heap[ix];
        this.heap[ix] = this.heap[iy];
        this.heap[iy] = temp;
    }
}