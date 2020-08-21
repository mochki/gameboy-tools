import { MBC } from "./mbc";
import MBCWithRTC from "./mbc_with_rtc";
import { RTC } from "./rtc";
import { BIT_6, BIT_7, bitTest } from "../util/bits";

export default class MBC3 extends MBCWithRTC {
    rtc: RTC = new RTC();
    romBank: number = 1;
    ramBank: number = 0;

    sram = new Uint8Array(0x2000 * 4);
    sramDirty = false;
    sramEnable = false;

    read8(addr: number): number {
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.sramEnable) {
                switch (this.ramBank) {
                    case 0x0:
                    case 0x1:
                    case 0x2:
                    case 0x3:
                        let index = (addr - 0xA000) + (this.ramBank * 0x2000);
                        return this.sram[index];

                    case 0x8:
                        return this.rtc.getSeconds();
                    case 0x9:
                        return this.rtc.minutes;
                    case 0xA:
                        return this.rtc.hours;
                    case 0xB:
                        return (this.rtc.days >> 0) & 0xFF;
                    case 0xC:
                        let val = 0;
                        val |= (this.rtc.days >> 8) & 0x01;
                        val |= this.rtc.halted ? BIT_6 : 0;
                        val |= this.rtc.daysOverflow ? BIT_7 : 0;
                        return val;
                }
            } else {
                return 0xFF;
            }
        }
        return 0xFF;
    }
    
    write8(addr: number, val: number): void {
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            this.sramEnable = (val & 0xF) == 0xA;
        }
        else if (addr >= 0x2000 && addr <= 0x3FFF) {
            this.romBank = val;
        } else if (addr >= 0x4000 && addr <= 0x5FFF) {
            this.ramBank = val;
        } else if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.sramEnable) {
                switch (this.ramBank) {
                    case 0x0:
                    case 0x1:
                    case 0x2:
                    case 0x3:
                        this.sramDirty = true;
                        let index = (addr - 0xA000) + (this.ramBank * 0x2000);
                        this.sram[index] = val;
                        break;

                    case 0x8:
                        this.rtc.setSeconds(val % 60);
                        break;
                    case 0x9:
                        this.rtc.minutes = val % 60;
                        break;
                    case 0xA:
                        this.rtc.hours = val % 24;
                        break;
                    case 0xB:
                        this.rtc.days &= ~0xFF;
                        this.rtc.days |= (val << 0) & 0xFF;
                        break;
                    case 0xC:
                        this.rtc.days &= ~0x100;
                        this.rtc.days |= (val << 8) & 0x100;
                        this.rtc.halted = bitTest(val, 6);
                        this.rtc.daysOverflow = bitTest(val, 7);
                        break;
                }
            }
        }
        return;
    }

    getOffset() {
        return this.romBank * 0x4000;
    }
}