import { CreateDeviceObjects } from "../frontend/imgui_impl";

export type SchedulerCallback = () => void;
export class SchedulerEvent {
    id: SchedulerId;
    ticks: number;
    callback: SchedulerCallback;
    index: number = 0;

    constructor(id: SchedulerId, ticks: number, callback: SchedulerCallback) {
        this.id = id;
        this.ticks = ticks;
        this.callback = callback;
    }
}

export enum SchedulerId {
    None = "None",
    PPU = "PPU",
    TimerDIV = "TimerDIV",
    EnableInterrupts = "EnableInterrupts",
    APUSample = "APUSample",
    APUChannel1 = "APUChannel1",
    APUChannel2 = "APUChannel2",
    APUChannel3 = "APUChannel3",
    APUChannel4 = "APUChannel4",
    TimerAPUFrameSequencer = "TimerAPUFrameSequencer"

}

function parent(n: number) { return (n - 1) >> 1; }
function leftChild(n: number) { return n * 2 + 1; }
function rightChild(n: number) { return n * 2 + 2; }

export class Scheduler {
    constructor() {
        for (let i = 0; i < 64; i++) {
            this.heap[i] = new SchedulerEvent(SchedulerId.None, 0, () => { });
            this.heap[i].index = i;
        }
    }

    currTicks = 0;
    nextEventTicks = 0;

    heap: SchedulerEvent[] = new Array(64);
    heapSize = 0;

    static createEmptyEvent() {
        return new SchedulerEvent(SchedulerId.None, 0, () => { });
    }

    addEventRelative(id: SchedulerId, ticks: number, callback: SchedulerCallback): void {
        ticks += this.currTicks;
        if (this.heapSize >= this.heap.length) {
            alert("Heap overflow!");
        }

        let index = this.heapSize;
        this.heapSize++;
        this.heap[index].id = id;
        this.heap[index].ticks = ticks;
        this.heap[index].callback = callback;
        this.heap[index].index = index;

        while (index != 0) {
            let parentIndex = parent(index);
            if (this.heap[parentIndex].ticks > this.heap[index].ticks) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
        this.updateNextEvent();
    }

    cancelEventsById(id: SchedulerId) {
        let go = true;
        while (go) {
            go = false;
            for (let i = 0; i < this.heapSize; i++) {
                if (this.heap[i].id == id) {
                    this.deleteEvent(i);
                    go = true;
                    break;
                }
            }
        }
    }

    updateNextEvent() {
        if (this.heapSize > 0) {
            this.nextEventTicks = this.heap[0].ticks;
        }
    }

    getFirstEvent(): SchedulerEvent {
        if (this.heapSize <= 0) {
            alert("Tried to get from empty heap!");
            return this.heap[0]; // This isn't supposed to happen.
        }

        return this.heap[0];
    }

    returnEvent = Scheduler.createEmptyEvent();

    popFirstEvent(): SchedulerEvent {
        let event = this.getFirstEvent();

        this.returnEvent.ticks = event.ticks;
        this.returnEvent.id = event.id;
        this.returnEvent.callback = event.callback;
        this.returnEvent.index = event.index;

        if (this.heapSize == 1) {
            this.heapSize--;
            return this.returnEvent;
        }

        this.swap(0, this.heapSize - 1);

        this.heapSize--;

        // Satisfy the heap property again
        let index = 0;
        while (true) {
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
                index = smallest;
            } else {
                break;
            }
        }

        this.updateNextEvent();
        return this.returnEvent;
    }

    setTicksLower(index: number, newVal: number) {
        this.heap[index].ticks = newVal;

        while (index != 0) {
            let parentIndex = parent(index);
            if (this.heap[parentIndex].ticks > this.heap[index].ticks) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    deleteEvent(index: number) {
        this.setTicksLower(index, -9999);
        this.popFirstEvent();
    }

    swap(ix: number, iy: number) {
        // console.log(`Swapped ${ix} with ${iy}`);
        let temp = this.heap[ix];
        this.heap[ix] = this.heap[iy];
        this.heap[ix].index = ix;
        this.heap[iy] = temp;
        this.heap[iy].index = iy;
    }
}