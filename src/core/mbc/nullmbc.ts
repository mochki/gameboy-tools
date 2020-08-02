import { MBC } from "./mbc";

export default class NullMBC implements MBC {
    romBank: number = 1;
    read8(addr: number): number {
        return 0;
    }
    write8(addr: number, value: number): void {
        return;
    }
    getOffset(): number {
        return 0x4000;
    }
}