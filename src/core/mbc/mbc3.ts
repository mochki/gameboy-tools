import { MBC } from "./mbc";

export default class MBC3 implements MBC {
    romBank: number = 1;
    read8(addr: number): number {
        throw new Error("Method not implemented.");
    }
    write8(addr: number, value: number): number {
        throw new Error("Method not implemented.");
    }

    getOffset() {
        return this.romBank * 0x4000;
    }
}