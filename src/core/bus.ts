import { PPU } from './ppu';
import { GameBoy } from './gameboy';
import { hex } from './util/misc';
export class Bus {
    gb: GameBoy;
    ppu: PPU;

    constructor(gb: GameBoy, ppu: PPU) {
        this.gb = gb;
        this.ppu = ppu;
    }

    bootrom = new Uint8Array(0x100);
    bootromEnabled = true;

    rom = new Uint8Array(2 ^ 23);
    romOffset = 0;

    hram = new Uint8Array(127);

    wram = [
        new Uint8Array(0x1000),
        new Uint8Array(0x1000),
        new Uint8Array(0x1000),
        new Uint8Array(0x1000),
        new Uint8Array(0x1000),
        new Uint8Array(0x1000),
        new Uint8Array(0x1000),
        new Uint8Array(0x1000),
    ];
    wramBank = 0;

    read8(addr: number): number {
        switch (addr >> 12) {
            case 0x0: // ROM0 - 0###
                if (this.bootromEnabled) {
                    return this.bootrom[addr];
                } else {
                    return this.rom[addr];
                }
            case 0x1: // ROM0 - 1###
            case 0x2: // ROM0 - 2###
            case 0x3: // ROM0 - 3###
                return this.rom[addr];
            case 0x4: // ROMX - 4### 
            case 0x5: // ROMX - 5### 
            case 0x6: // ROMX - 6### 
            case 0x7: // ROMX - 7### 
                return this.rom[addr + this.romOffset];
            case 0x8: // VRAM - 8###
            case 0x9: // VRAM - 9###
                return this.ppu.read8(addr);
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                break;
            case 0xC: // WRAM0 - C###
                return this.wram[0][addr & 0xFFF];
            case 0xD: // WRAMX - D###
                return this.wram[this.wramBank][addr & 0xFFF];
            case 0xE: // OAM - E###
                break;
            case 0xF: // ZeroPage - F###
                if (addr >= 0xFF00 && addr <= 0xFF7F) {
                    return 0xFF;
                }
                else if (addr >= 0xFF80 && addr <= 0xFFFE) {
                    return this.hram[addr - 0xFF80];
                }
                break;
        }

        this.gb.error(`Out of bounds read, addr: ${hex(addr, 4)}`);
        return 0xFF;
    }

    write8(addr: number, val: number): void {
        switch (addr >> 12) {
            case 0x0: // ROM0 - 0###
            case 0x1: // ROM0 - 1###
            case 0x2: // ROM0 - 2###
            case 0x3: // ROM0 - 3###
                return;
            case 0x4: // ROMX - 4### 
            case 0x5: // ROMX - 5### 
            case 0x6: // ROMX - 6### 
            case 0x7: // ROMX - 7### 
                return;
            case 0x8: // VRAM - 8###
            case 0x9: // VRAM - 9###
                this.ppu.write8(addr, val);
                return;
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                break;
            case 0xC: // WRAM0 - C###
                this.wram[0][addr & 0xFFF] = val;
                return;
            case 0xD: // WRAMX - D###
                this.wram[this.wramBank][addr & 0xFFF] = val;
                return;
            case 0xE: // OAM - E###
                break;
            case 0xF: // ZeroPage - F###
                if (addr >= 0xFF00 && addr <= 0xFF7F) {
                    return;
                }
                else if (addr >= 0xFF80 && addr <= 0xFFFE) {
                    this.hram[addr - 0xFF80] = val;
                    return;
                }
                break;
        }

        this.gb.error(`Out of bounds write, addr: ${hex(addr, 4)}`);
    }
} 