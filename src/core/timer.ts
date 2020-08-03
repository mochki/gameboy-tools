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

        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, 8192, this.gb.apu.advanceFrameSequencer);
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel] * 2, this.scheduledTimaIncrement);
    }

    enabled = false;
    bitSel = 0;

    private div = 0;
    lastDivResetTicks = 0; // In scheduler ticks
    lastDivLazyResetTicks = 0;

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

    scheduledTimaIncrement = function (this: Timer, cyclesLate: number) {
        this.timaIncrement();
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel] - cyclesLate, this.scheduledTimaIncrement);
    }.bind(this);

    timaIncrement() {
        if (this.enabled) {
            this.counter++;
            if (this.counter > 255) {
                this.counter = 0;
                this.reloadPending = true;
                this.scheduler.addEventRelative(SchedulerId.TimerReload, 4, this.interruptAndReloadTima);
            }
        }
    }

    changeBitSel(newBitSel: number) {
        let internal = (this.scheduler.currTicks - this.lastDivResetTicks) & 0xFFFF;
        if (
            newBitSel != this.bitSel &&
            bitTest(internal, timerBits[this.bitSel]) &&
            !bitTest(internal, timerBits[newBitSel]) &&
            this.enabled
        ) {
            console.log("Unexpected timer increment from bit select change");
            this.timaIncrement();
        }
        this.bitSel = newBitSel;
    }

    onDisable() {
        let internal = (this.scheduler.currTicks - this.lastDivResetTicks) & 0xFFFF;
        if (bitTest(internal, timerBits[this.bitSel])) {
            console.log("Unexpected timer increment from disable");
            this.timaIncrement();
        }
    }

    resetDiv() {
        this.div = 0;
        this.lastDivResetTicks = this.scheduler.currTicks;
        this.lastDivLazyResetTicks = this.scheduler.currTicks;
        if (bitTest(this.div, 5)) this.gb.apu.advanceFrameSequencer(); // Frame sequencer clock uses falling edge detector

        this.scheduler.cancelEventsById(SchedulerId.TimerAPUFrameSequencer);
        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, 8192, this.gb.apu.advanceFrameSequencer);

        this.scheduler.cancelEventsById(SchedulerId.TimerIncrement);
        this.scheduler.addEventRelative(SchedulerId.TimerIncrement, timerIntervals[this.bitSel], this.scheduledTimaIncrement);
    }

    getDiv() {
        let cyclesBehind = this.scheduler.currTicks - this.lastDivLazyResetTicks;
        let incrementDivBy = (cyclesBehind >> 8) & 0xFF;
        this.lastDivLazyResetTicks += (cyclesBehind & 0xFFFFFF00);
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
                this.changeBitSel(val & 0b11);
                if (this.enabled && !bitTest(val, 2)) this.onDisable();
                this.enabled = bitTest(val, 2);
                break;
        }
    }
}