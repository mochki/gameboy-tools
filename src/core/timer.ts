import { GameBoy } from "./gameboy";
import { SchedulerEvent, SchedulerId, Scheduler } from "./scheduler";
import { bitTest, bitSet } from "./util/bits";
import { TickSignal } from "tone";
import { InterruptId } from "./interrupts";

const timerBits = Uint16Array.from([9, 3, 5, 7]);
const timerMasks = Uint16Array.from([1 << 9, 1 << 3, 1 << 5, 1 << 7]);
const timerIntervals = Uint16Array.from([1024, 16, 64, 256]);

export class Timer {

    gb: GameBoy;
    scheduler: Scheduler;

    constructor(gb: GameBoy, scheduler: Scheduler) {
        this.gb = gb;
        this.scheduler = scheduler;

        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, 16384, this.gb.apu.advanceFrameSequencer);
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel] * 2, this.incrementTima);
    }

    enabled = false;
    bitSel = 0;

    private div = 0;
    lastDivModify = 0; // In scheduler ticks

    counter = 0;
    modulo = 0;

    reloadPending = false;
    reloading = false;
    reloadCancel = false;

    interruptAndReloadTima = function (this: Timer, cyclesLate: number) {
        this.reloadPending = false;
        if (!this.reloadCancel) {
            this.counter = this.modulo;
            this.gb.interrupts.flagInterrupt(InterruptId.Timer);
            this.reloadCancel = false;
        }
        this.reloading = true;
        this.scheduler.addEventRelative(SchedulerId.TimerReload, 4, this.finishReloading);
    }.bind(this);

    finishReloading = function (this: Timer, cyclesLate: number) {
        this.reloading = false;
    }.bind(this);

    incrementTima = function (this: Timer, cyclesLate: number) {
        // TODO: Implement basically all of the obscure behavior and edge cases with timer and TIMA increments.

        if (this.enabled) {
            this.counter++;
            if (this.counter > 255) {
                this.counter = 0;
                this.reloadPending = true;
                this.scheduler.addEventRelative(SchedulerId.TimerReload, 4, this.interruptAndReloadTima);
            }
        }

        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel] - cyclesLate, this.incrementTima);
    }.bind(this);

    resetDiv() {
        this.div = 0;
        this.lastDivModify = this.scheduler.currTicks;
        if (bitTest(this.div, 5)) this.gb.apu.advanceFrameSequencer();

        this.scheduler.cancelEventsById(SchedulerId.TimerAPUFrameSequencer);
        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, 16384, this.gb.apu.advanceFrameSequencer);

        this.scheduler.cancelEventsById(SchedulerId.TimerIncrement);
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel], this.incrementTima);
    }

    getDiv() {
        let cyclesBehind = this.scheduler.currTicks - this.lastDivModify;
        let incrementDivBy = (cyclesBehind >> 8) & 0xFF;
        this.lastDivModify += (cyclesBehind & 0xFFFFFF00);
        this.div += incrementDivBy;
        this.div &= 0xFF;
        return this.div;
    }

    readHwio8(addr: number): number {
        switch (addr) {
            case 0xFF04: // DIV
                return this.getDiv();
            case 0xFF05: // TIMA
                return this.counter;
            case 0xFF06: // TMA
                return this.modulo;
            case 0xFF07: // TAC
                let val = 0;

                val |= this.bitSel & 0b11;
                if (this.enabled) val = bitSet(val, 2);

                return val;
        }
        return 0xFF;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF04: // DIV
                this.resetDiv();
                break;
            case 0xFF05: // TIMA
                if (!this.reloading) {
                    this.counter = val;
                } else {
                    this.counter = this.modulo;
                }
                if (this.reloadPending) this.reloadCancel = true;
                break;
            case 0xFF06: // TMA
                this.modulo = val;
                if (this.reloading) this.counter = val;
                break;
            case 0xFF07: // TAC
                this.bitSel = val & 0b11;
                this.enabled = bitTest(val, 2);
                break;
        }
    }
}