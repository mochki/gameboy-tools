import { GameBoy } from "./gameboy";
import { SchedulerEvent, SchedulerId } from "./scheduler";

export class Timer {
    gb: GameBoy;
    constructor(gb: GameBoy) {
        this.gb = gb;
        this.gb.scheduler.addEventRelative(SchedulerId.TimerDIV, 256, this.incrementDiv);
    }

    div = 0;

    incrementDiv = function (this: Timer) {
        this.div++;
        this.div &= 0xFF;
        this.gb.scheduler.addEventRelative(SchedulerId.TimerDIV, 256, this.incrementDiv);
    }.bind(this);

    resetDiv = function (this: Timer) {
        this.gb.scheduler.cancelEventsById(SchedulerId.TimerDIV);
        this.gb.scheduler.addEventRelative(SchedulerId.TimerDIV, 256, this.incrementDiv);
    }.bind(this);

    readHwio8(addr: number): number {
        switch (addr) {
            case 0xFF04: // DIV
                return this.div;
            case 0xFF05: // TIMA
                return 0xFF;
            case 0xFF06: // TMA
                return 0xFF;
            case 0xFF07: // TAC
                return 0xFF;
        }
        return 0xFF;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF04: // DIV
                this.resetDiv();
                break;
            case 0xFF05: // TIMA
                break;
            case 0xFF06: // TMA
                break;
            case 0xFF07: // TAC
                break;
        }
    }
}