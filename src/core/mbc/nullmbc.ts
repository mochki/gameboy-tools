import { MBC } from "./mbc";

export default class NullMBC extends MBC {
    romBank: number = 1;
    sram = new Uint8Array(0x4000);
    sramDirty = false;

    read8(addr: number): number {
        return 0xFF;
    }
    write8(addr: number, value: number): void {
        return;
    }
    getOffset(): number {
        return 0x4000;
    }
}