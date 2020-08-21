import { PPU, PPUMode } from './ppu';
import { GameBoy } from './gameboy';
import { hex } from './util/misc';
import { bitTest } from './util/bits';
import { Joypad } from './joypad';
import { Timer } from './timer';
import { APU } from './apu';
import { MBC } from './mbc/mbc';
import NullMBC from './mbc/nullmbc';
import MBC3 from './mbc/mbc3';
import { GameBoyProvider } from './provider';
export class Bus {
    gb: GameBoy;
    ppu: PPU;
    joypad: Joypad;
    timer: Timer;
    apu: APU;

    constructor(gb: GameBoy, ppu: PPU, joypad: Joypad, timer: Timer, sound: APU, provider?: GameBoyProvider) {
        this.gb = gb;
        this.ppu = ppu;
        this.joypad = joypad;
        this.timer = timer;
        this.apu = sound;

        if (provider) {
            for (let i = 0; i < provider.rom.length; i++) {
                if (i < this.rom.length) {
                    this.rom[i] = provider.rom[i];
                }
            }
            for (let i = 0; i < provider.bootrom.length; i++) {
                if (i < this.bootrom.length) {
                    this.bootrom[i] = provider.bootrom[i];
                }
            }
        }

        for (let i = 0; i < 0x100; i++) {
            this.romBootromOverlay[i] = this.rom[i];;
            this.rom[i] = this.bootrom[i];
        }
    }

    mbc: MBC = new NullMBC();

    updateMapper() {
        let id = this.rom[0x147];

        switch (id) {
            case 0x00:
                this.mbc = new NullMBC();
                break;
            case 0x01:
            case 0x02:
            case 0x03: // MBC1
                this.mbc = new MBC3();
                break;
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13: // MBC3
                this.mbc = new MBC3();
                break;
            case 0x19:
            case 0x1A:
            case 0x1B:
            case 0x1C:
            case 0x1D:
            case 0x1E:
                this.mbc = new MBC3();
                break;
        }

        this.romOffset = this.mbc.getOffset();
        // this.gb.cgb = 
    }

    bootrom = new Uint8Array(0x100).fill(0xFF);
    bootromEnabled = true;

    romBootromOverlay = new Uint8Array(0x100).fill(0xFF);

    rom = new Uint8Array(8388608).fill(0xFF);
    romOffset = 0;

    hram = new Uint8Array(127).fill(0xFF);

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

    unmapBootrom() {
        this.bootromEnabled = false;
        for (let i = 0; i < 0x100; i++) {
            this.rom[i] = this.romBootromOverlay[i];
        }
    }

    read8(addr: number): number {
        switch (addr >> 12) {
            case 0x0: // ROM0 - 0###
            // There is no bootrom check to be found here. Bootrom unmapping is done in unmapBootrom().
            case 0x1: // ROM0 - 1###
            case 0x2: // ROM0 - 2###
            case 0x3: // ROM0 - 3###
                return this.rom[addr];
            case 0x4: // ROMX - 4### 
            case 0x5: // ROMX - 5### 
            case 0x6: // ROMX - 6### 
            case 0x7: // ROMX - 7### 
                return this.rom[(addr & 0x3FFF) + this.romOffset];
            case 0x8: // VRAM - 8###
            case 0x9: // VRAM - 9###
                return this.ppu.read8(addr);
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                return this.mbc.read8(addr);
            case 0xC: // WRAM0 - C###
                return this.wram[0][addr & 0xFFF];
            case 0xD: // WRAMX - D###
                return this.wram[this.wramBank][addr & 0xFFF];
            case 0xE: // Echo RAM - E###
                return this.wram[0][addr & 0xFFF];
            case 0xF: // ZeroPage - F###
                if (addr >= 0xFE00 && addr <= 0xFE9F) {
                    return this.ppu.readOam8(addr);
                }

                switch (addr) {
                    case 0xFF00: // JOYP
                        return this.joypad.readHwio8();

                    case 0xFF04: // DIV
                    case 0xFF05: // TIMA
                    case 0xFF06: // TMA
                    case 0xFF07: // TAC
                        return this.timer.readHwio8(addr);

                    case 0xFF10: case 0xFF11: case 0xFF12: case 0xFF13: case 0xFF14: // NR1X
                    case 0xFF15: case 0xFF16: case 0xFF17: case 0xFF18: case 0xFF19: // NR2X
                    case 0xFF1A: case 0xFF1B: case 0xFF1C: case 0xFF1D: case 0xFF1E: // NR3X
                    case 0xFF1F: case 0xFF20: case 0xFF21: case 0xFF22: case 0xFF23: // NR4X
                    case 0xFF24: case 0xFF25: case 0xFF26: // NR5X
                    case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37: // Wave Table
                    case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F: // Wave Table
                        return this.apu.readHwio8(addr);

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
                        return this.gb.cpu.readHwio8(addr);
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
            case 0x4: // ROMX - 4### 
            case 0x5: // ROMX - 5### 
            case 0x6: // ROMX - 6### 
            case 0x7: // ROMX - 7### 
                this.mbc.write8(addr, val);
                this.romOffset = this.mbc.getOffset();
                return;
            case 0x8: // VRAM - 8###
            case 0x9: // VRAM - 9###
                this.ppu.write8(addr, val);
                return;
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                this.mbc.write8(addr, val);
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
                if (addr >= 0xFE00 && addr <= 0xFE9F) {
                    this.ppu.writeOam8(addr, val);
                    return;
                }

                switch (addr) {
                    case 0xFF00: // JOYP
                        this.joypad.writeHwio8(val);
                        return;

                    case 0xFF01: // SB
                        this.serialOut += String.fromCharCode(val);
                        return;

                    case 0xFF04: // DIV
                    case 0xFF05: // TIMA
                    case 0xFF06: // TMA
                    case 0xFF07: // TAC
                        this.timer.writeHwio8(addr, val);
                        return;

                    case 0xFF10: case 0xFF11: case 0xFF12: case 0xFF13: case 0xFF14: // NR1X
                    case 0xFF15: case 0xFF16: case 0xFF17: case 0xFF18: case 0xFF19: // NR2X
                    case 0xFF1A: case 0xFF1B: case 0xFF1C: case 0xFF1D: case 0xFF1E: // NR3X
                    case 0xFF1F: case 0xFF20: case 0xFF21: case 0xFF22: case 0xFF23: // NR4X
                    case 0xFF24: case 0xFF25: case 0xFF26: // NR5X
                    case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37: // Wave Table
                    case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F: // Wave Table
                        this.apu.writeHwio8(addr, val);
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
                        if (bitTest(val, 0) && this.bootromEnabled) {
                            this.unmapBootrom();
                        }
                        return;

                    case 0xFF0F: // IF
                    case 0xFFFF: // IE
                        this.gb.cpu.writeHwio8(addr, val);
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

    static getTitle(rom: Uint8Array): string {
        let title = rom.subarray(0x134, 0x143);
        return String.fromCharCode(...title);
    }
} 