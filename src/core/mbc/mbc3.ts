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

    rtcSecondsLatch = 0;
    rtcMinutesLatch = 0;
    rtcHoursLatch = 0;
    rtcDaysLatch = 0;

    rtcLatchVal = 0;

    read8(addr: number): number {
        switch (addr >> 12) {
            case 0xA:
            case 0xB:
                if (this.sramEnable) {
                    switch (this.ramBank) {
                        case 0x0:
                        case 0x1:
                        case 0x2:
                        case 0x3:
                            let index = (addr - 0xA000) + (this.ramBank * 0x2000);
                            return this.sram[index];

                        case 0x8:
                            return this.rtcSecondsLatch;
                        case 0x9:
                            return this.rtcMinutesLatch;
                        case 0xA:
                            return this.rtcHoursLatch;
                        case 0xB:
                            return (this.rtcDaysLatch >> 0) & 0xFF;
                        case 0xC:
                            let val = 0;
                            val |= (this.rtcDaysLatch >> 8) & 0x01;
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
        switch (addr >> 12) {
            case 0x0:
            case 0x1:
                this.sramEnable = (val & 0xF) == 0xA;
                break;
            case 0x2:
            case 0x3:
                this.romBank = val;
                if (this.romBank == 0) {
                    this.romBank = 1;
                }
                break;
            case 0x4:
            case 0x5:
                this.ramBank = val;
                break;
            case 0x6:
            case 0x7:
                val &= 1;
                if (this.rtcLatchVal == 0 && val == 1) {
                    this.rtcSecondsLatch = this.rtc.seconds;
                    this.rtcMinutesLatch = this.rtc.minutes;
                    this.rtcHoursLatch = this.rtc.hours;
                    this.rtcDaysLatch = this.rtc.days;
                }
                this.rtcLatchVal = val;
                break;
            case 0xA:
            case 0xB:
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
                            // console.log(`set seconds: ${val}`);
                            this.rtc.setSeconds(val % 60);
                            break;
                        case 0x9:
                            // console.log(`set minutes: ${val}`);
                            this.rtc.minutes = val % 60;
                            break;
                        case 0xA:
                            // console.log(`set hours: ${val}`);
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
                break;
        }
    }

    getOffset() {
        return this.romBank * 0x4000;
    }
}