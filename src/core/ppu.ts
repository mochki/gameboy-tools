import { GameBoy } from './gameboy';
export class PPU {
    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    read8(addr: number): number {

        return 0;
    }

    write8(addr: number, val: number): void {

        return;
    }
}