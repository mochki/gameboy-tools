import { bitSet, bitTest, bitReset } from "./util/bits";

export enum InterruptId {
    Vblank = 0,
    Stat = 1,
    Timer = 2,
    Serial = 3,
    Joypad = 4,
}

export class Interrupts {
    ie = 0;
    if = 0;

    flagInterrupt(id: InterruptId) {
        this.if = bitSet(this.if, id);
    }
    clearInterrupt(id: InterruptId) {
        this.if = bitReset(this.if, id);
    }

    readHwio8(addr: number): number {
        switch (addr) {
            case 0xFF0F: // IF
                return this.if;
            case 0xFFFF: // IE
                return this.ie;
            default:
                return 0xFF;
        }
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF0F: // IF
                this.if = val & 0b11111;
                break;
            case 0xFFFF: // IE
                this.ie = val;
                break;
        }
    }
}