export abstract class MBC {
    abstract romBank: number;
    abstract sram: Uint8Array;
    abstract sramDirty: boolean;

    abstract read8(addr: number): number;

    /** Returns the offset for 0x4000-0x7FFF */
    abstract write8(addr: number, value: number): void;

    abstract getOffset(): number;

    setSram(source: Uint8Array) {
        for (let i = 0; i < this.sram.length; i++) {
            if (i < source.length) {
                this.sram[i] = source[i];
            }
        }
    }
}