import { MBC } from "./mbc";

export default class MBC3 implements MBC {
    romBank: number = 1;
    ramBank: number = 0;

    ram = new Uint8Array(0x2000 * 8);
    sramDirty = false;

    read8(addr: number): number {
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            let index = (addr - 0xA000) + (this.ramBank * 0x2000);
            return this.ram[index];
        }
        return 0xFF;
    }
    write8(addr: number, val: number): void {
        if (addr >= 0x2000 && addr <= 0x3FFF) {
            this.romBank = val;
        } else if (addr >= 0x4000 && addr <= 0x5FFF) {
            if (val >= 0 && val <= 7) {
                this.ramBank = val;
            }
        } else if (addr >= 0xA000 && addr <= 0xBFFF) {
            this.sramDirty = true;
            let index = (addr - 0xA000) + (this.ramBank * 0x2000);
            this.ram[index] = val;
        }
        return;
    }

    getOffset() {
        return this.romBank * 0x4000;
    }
}