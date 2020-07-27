import { GameBoy } from './gameboy';
export class Bus {
    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    bootrom = new Uint8Array(0x100);
    bootromEnabled = true;

    rom = new Uint8Array(2 ^ 23);
    romOffset = 0;

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
                break;
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                break;
            case 0xC: // WRAM0 - C###
                break;
            case 0xD: // WRAMX - D###
                break;
            case 0xE: // OAM - E###
                break;
            case 0xF: // ZeroPage - F###
                break;
        }

        this.gb.error("Out of bounds read");
        return 0xFF;
    }

    write8(addr: number, val: number): void {
        switch (addr >> 12) {
            case 0x0: // ROM0 - 0###
            case 0x1: // ROM0 - 1###
            case 0x2: // ROM0 - 2###
            case 0x3: // ROM0 - 3###
                break;
            case 0x4: // ROMX - 4### 
            case 0x5: // ROMX - 5### 
            case 0x6: // ROMX - 6### 
            case 0x7: // ROMX - 7### 
                break;
            case 0x8: // VRAM - 8###
            case 0x9: // VRAM - 9###
                break;
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                break;
            case 0xC: // WRAM0 - C###
                break;
            case 0xD: // WRAMX - D###
                break;
            case 0xE: // OAM - E###
                break;
            case 0xF: // ZeroPage - F###
                break;
        }

        this.gb.error("Out of bounds write");
    }
} 