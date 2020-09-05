import { bitSet, bitTest } from "./util/bits";
import { GameBoy } from "./gameboy";
import { Scheduler, SchedulerId } from "./scheduler";
import { InterruptId } from "./interrupts";

export class Serial {
    gb: GameBoy;
    scheduler: Scheduler;

    constructor(gb: GameBoy, scheduler: Scheduler) {
        this.gb = gb;
        this.scheduler = scheduler;
    }

    transferActive = false;
    clockSpeed = false;
    shiftClockInternal = false;

    data = 0;
    bitsRemaining = 0;

    startTransfer() {
        this.scheduler.addEventRelative(SchedulerId.SerialClock, this.clockSpeed ? 16 : 512, this.shiftOut);
    }

    shiftOut = (cyclesLate: number) => {
        this.data >>= 1;
        // If there is no slave connected, incoming bits are 1
        this.data |= 0b10000000;
        this.bitsRemaining--;

        if (this.bitsRemaining > 0) {
            this.scheduler.addEventRelative(SchedulerId.SerialClock, (this.clockSpeed ? 16 : 512) - cyclesLate, this.shiftOut);
        } else {
            this.transferActive = false;
            this.gb.cpu.flagInterrupt(InterruptId.Serial);
        }
    };

    readHwio8(addr: number): number {
        switch (addr) {
            case 0xFF01:
                return this.data;
            case 0xFF02:
                let val = 0;
                if (this.transferActive) val = bitSet(val, 7);
                if (this.clockSpeed) val = bitSet(val, 1);
                if (this.shiftClockInternal) val = bitSet(val, 0);
                return val | 0b01111100;
        }
        return 0xFF;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF01:
                this.data = val;
                return;
            case 0xFF02:
                let oldTransferActive = this.transferActive;

                this.transferActive = bitTest(val, 7);
                this.clockSpeed = bitTest(val, 1);
                this.shiftClockInternal = bitTest(val, 0);

                if (!oldTransferActive && this.transferActive && this.shiftClockInternal) {
                    this.bitsRemaining = 8;
                    // console.log("Starting serial transfer");
                    this.startTransfer();
                }
                return;
        }
    }
}