export interface MBC {
    romBank: number;
    ram: Uint8Array;
    sramDirty: boolean;

    read8(addr: number): number;

    /** Returns the offset for 0x4000-0x7FFF */
    write8(addr: number, value: number): void;

    getOffset(): number;
}