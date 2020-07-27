import { bitSet, bitTest } from "./util/bits";

export enum InterruptId {
    Vblank = 0,
    Stat = 1,
    Timer = 2,
    Serial = 3,
    Joypad = 4,
}

export class Interrupts {
    private ie_vblank = false;
    private ie_stat = false;
    private ie_timer = false;
    private ie_serial = false;
    private ie_joypad = false;

    private if_vblank = false;
    private if_stat = false;
    private if_timer = false;
    private if_serial = false;
    private if_joypad = false;

    flagInterrupt(id: InterruptId) {
        switch (id) {
            case InterruptId.Vblank:
                this.if_vblank = true;
                break;
            case InterruptId.Stat:
                this.if_stat = true;
                break;
            case InterruptId.Timer:
                this.if_timer = true;
                break;
            case InterruptId.Serial:
                this.if_serial = true;
                break;
            case InterruptId.Joypad:
                this.if_joypad = true;
                break;
        }
    }
    clearInterrupt(id: InterruptId) {
        switch (id) {
            case InterruptId.Vblank:
                this.if_vblank = false;
                break;
            case InterruptId.Stat:
                this.if_stat = false;
                break;
            case InterruptId.Timer:
                this.if_timer = false;
                break;
            case InterruptId.Serial:
                this.if_serial = false;
                break;
            case InterruptId.Joypad:
                this.if_joypad = false;
                break;
        }
    }

    readHwio8(addr: number): number {
        let val = 0;
        switch (addr) {
            case 0xFF0F:
                if (this.if_vblank) val = bitSet(val, 0);
                if (this.if_stat) val = bitSet(val, 1);
                if (this.if_timer) val = bitSet(val, 2);
                if (this.if_serial) val = bitSet(val, 3);
                if (this.if_joypad) val = bitSet(val, 4);
                break;
            case 0xFFFF:
                if (this.ie_vblank) val = bitSet(val, 0);
                if (this.ie_stat) val = bitSet(val, 1);
                if (this.ie_timer) val = bitSet(val, 2);
                if (this.ie_serial) val = bitSet(val, 3);
                if (this.ie_joypad) val = bitSet(val, 4);
                break;
            default:
                return 0xFF;
        }

        return val;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF0F:
                this.if_vblank = bitTest(val, 0);
                this.if_stat = bitTest(val, 1);
                this.if_timer = bitTest(val, 2);
                this.if_serial = bitTest(val, 3);
                this.if_joypad = bitTest(val, 4);
                break;
            case 0xFFFF:
                this.ie_vblank = bitTest(val, 0);
                this.ie_stat = bitTest(val, 1);
                this.ie_timer = bitTest(val, 2);
                this.ie_serial = bitTest(val, 3);
                this.ie_joypad = bitTest(val, 4);
                break;
        }
    }
}