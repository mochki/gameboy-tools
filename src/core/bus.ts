import { Interrupts } from './interrupts';
import { PPU } from './ppu';
import { GameBoy } from './gameboy';
import { hex } from './util/misc';
import { bitTest } from './util/bits';
export class Bus {
    gb: GameBoy;
    ppu: PPU;
    interrupts: Interrupts;

    constructor(gb: GameBoy, ppu: PPU, interrupts: Interrupts) {
        this.gb = gb;
        this.ppu = ppu;
        this.interrupts = interrupts;
    }

    bootrom = new Uint8Array(0x100);
    bootromEnabled = true;

    rom = new Uint8Array(8388608);
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
    wramBank = 1;

    serialOut = "";

    read8(addr: number): number {
        switch (addr >> 12) {
            case 0x0: // ROM0 - 0###
                if (this.bootromEnabled && addr < 0x100) {
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
            case 0xE: // Echo RAM - E###
                return this.wram[0][addr & 0xFFF];
            case 0xF: // ZeroPage - F###
                switch (addr) {
                    case 0xFF40: // LCDC
                    case 0xFF41: // STAT
                    case 0xFF42: // SCY
                    case 0xFF43: // SCX
                    case 0xFF44: // LY
                    case 0xFF45: // LYC
                    case 0xFF46: // DMA
                    case 0xFF47: // BGP
                    case 0xFF48: // OBP0
                    case 0xFF49: // OBP1
                    case 0xFF4A: // WY
                    case 0xFF4B: // WX

                    case 0xFF4F: // VBK

                    case 0xFF68: // BCPS/BGPI
                    case 0xFF69: // BCPD/BGPD
                    case 0xFF6A: // OCPS/OBPI
                    case 0xFF6B: // OCPD/OBPD
                        return this.ppu.readHwio8(addr);

                    case 0xFF0F: // IF
                    case 0xFFFF: // IE
                        return this.interrupts.readHwio8(addr);
                }
                if (addr >= 0xFF80 && addr <= 0xFFFE) { // HRAM
                    return this.hram[addr - 0xFF80];
                }
                return 0xFF;
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
                return;
            case 0xC: // WRAM0 - C###
                this.wram[0][addr & 0xFFF] = val;
                return;
            case 0xD: // WRAMX - D###
                this.wram[this.wramBank][addr & 0xFFF] = val;
                return;
            case 0xE: // Echo RAM - E###
                this.wram[0][addr & 0xFFF] = val;
                return;
            case 0xF: // ZeroPage - F###
                switch (addr) {
                    case 0xFF01: // SB
                        this.serialOut += String.fromCharCode(val);
                        return;

                    case 0xFF40: // LCDC
                    case 0xFF41: // STAT
                    case 0xFF42: // SCY
                    case 0xFF43: // SCX
                    case 0xFF44: // LY
                    case 0xFF45: // LYC
                    case 0xFF46: // DMA
                    case 0xFF47: // BGP
                    case 0xFF48: // OBP0
                    case 0xFF49: // OBP1
                    case 0xFF4A: // WY
                    case 0xFF4B: // WX

                    case 0xFF4F: // VBK

                    case 0xFF68: // BCPS/BGPI
                    case 0xFF69: // BCPD/BGPD
                    case 0xFF6A: // OCPS/OBPI
                    case 0xFF6B: // OCPD/OBPD
                        this.ppu.writeHwio8(addr, val);
                        return;

                    case 0xFF50: // Bootrom Disable
                        if (bitTest(val, 0)) this.bootromEnabled = false;
                        return;

                    case 0xFF0F: // IF
                    case 0xFFFF: // IE
                        this.interrupts.writeHwio8(addr, val);
                        return;
                }

                if (addr >= 0xFF80 && addr <= 0xFFFE) { // HRAM
                    this.hram[addr - 0xFF80] = val;
                    return;
                }
                return;
        }

        this.gb.error(`Out of bounds write, addr: ${hex(addr, 4)}`);
    }
} 