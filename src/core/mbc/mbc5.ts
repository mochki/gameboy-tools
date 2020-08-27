import { MBC } from "./mbc";
import MBCWithRTC from "./mbc_with_rtc";
import { RTC } from "./rtc";
import { BIT_6, BIT_7, bitTest } from "../util/bits";

export default class MBC5 extends MBC {
    romBank: number = 1;
    ramBank: number = 0;

    sram = new Uint8Array(0x2000 * 16);
    sramDirty = false;
    sramEnable = false;

    read8(addr: number): number {
        switch (addr >> 12) {
            case 0xA:
            case 0xB:
                if (this.sramEnable) {
                    switch (this.ramBank) {
                        case 0x0: case 0x4: case 0x8: case 0xC:
                        case 0x1: case 0x5: case 0x9: case 0xD:
                        case 0x2: case 0x6: case 0xA: case 0xE:
                        case 0x3: case 0x7: case 0xB: case 0xF:
                            let index = (addr - 0xA000) + (this.ramBank * 0x2000);
                            return this.sram[index];
                    }
                } else {
                    return 0xFF;
                }
        }
        return 0xFF;
    }

    write8(addr: number, val: number): void {
        switch (addr >> 12) {
            case 0x0:
            case 0x1:
                this.sramEnable = (val & 0xF) == 0xA;
                break;
            case 0x2:
                this.romBank &= ~0xFF;
                this.romBank |= (val << 0) & 0xFF;
                break;
            case 0x3:
                this.romBank &= ~0x100;
                this.romBank |= (val << 8) & 0x100;
                break;
            case 0x4:
            case 0x5:
                this.ramBank = val;
                break;
            case 0xA:
            case 0xB:
                if (this.sramEnable) {
                    switch (this.ramBank) {
                        case 0x0: case 0x4: case 0x8: case 0xC:
                        case 0x1: case 0x5: case 0x9: case 0xD:
                        case 0x2: case 0x6: case 0xA: case 0xE:
                        case 0x3: case 0x7: case 0xB: case 0xF:
                            this.sramDirty = true;
                            let index = (addr - 0xA000) + (this.ramBank * 0x2000);
                            this.sram[index] = val;
                            break;
                    }
                }
                break;
        }
    }

    getOffset() {
        return this.romBank * 0x4000;
    }
}