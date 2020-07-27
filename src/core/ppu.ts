import { GameBoy } from './gameboy';
export class PPU {
    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    vram = [
        new Uint8Array(0x2000),
        new Uint8Array(0x2000)
    ];
    vramBank = 0;

    read8(addr: number): number {
        addr -= 0x8000;
        return this.vram[this.vramBank][addr];
    }

    write8(addr: number, val: number): void {
        addr -= 0x8000;
        this.vram[this.vramBank][addr] = val;
        return;
    }
}