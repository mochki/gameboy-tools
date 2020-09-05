import { PPU, PPUMode } from './ppu';
import { GameBoy } from './gameboy';
import { hex } from './util/misc';
import { bitTest, bitSet } from './util/bits';
import { Joypad } from './joypad';
import { Timer } from './timer';
import { APU } from './apu';
import { MBC } from './mbc/mbc';
import NullMBC from './mbc/nullmbc';
import MBC3 from './mbc/mbc3';
import { GameBoyProvider } from './provider';
import MBC5 from './mbc/mbc5';
import { Serial } from './serial';
export class Bus {
    gb: GameBoy;
    ppu: PPU;
    joypad: Joypad;
    timer: Timer;
    apu: APU;
    serial: Serial;

    provider: GameBoyProvider;

    constructor(gb: GameBoy, ppu: PPU, joypad: Joypad, timer: Timer, sound: APU, serial: Serial, provider: GameBoyProvider) {
        this.gb = gb;
        this.ppu = ppu;
        this.joypad = joypad;
        this.timer = timer;
        this.apu = sound;
        this.serial = serial;

        this.provider = provider;

        if (provider) {
            for (let i = 0; i < provider.rom.length; i++) {
                if (i < this.rom.length) {
                    this.rom[i] = provider.rom[i];
                }
            }
            this.updateMapper(provider.rom);
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

    updateMapper(rom: Uint8Array) {
        let id = rom[0x147];

        let length = rom.length;

        length = Math.pow(2, Math.ceil(Math.log(length) / Math.log(2)));
        console.log(`ROM Size (rounded up to next power of 2): ${length}`);
        this.romOffsetMask = length - 1;

        switch (id) {
            case 0x00:
                this.mbc = new NullMBC();
                break;
            case 0x01:
            case 0x02:
            case 0x03: // MBC1
                this.mbc = new MBC3();
                break;
            case 0x0F:
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
            case 0x1E: // MBC5
                this.mbc = new MBC5();
                break;
        }

        this.romOffset = this.mbc.getOffset() & this.romOffsetMask;
        // this.gb.cgb = 
    }

    oamDmaActive = false;

    bootrom = new Uint8Array(0x100).fill(0xFF);
    bootromEnabled = true;

    romBootromOverlay = new Uint8Array(0x100).fill(0xFF);

    rom = new Uint8Array(8388608).fill(0xFF);
    romOffset = 0;
    romOffsetMask = 0xFFFFFFFF;

    hram = new Uint8Array(127).fill(0xFF);

    wram = new Uint8Array(0x8000);
    wramBank = 1;

    serialOut = "";

    unmapBootrom() {
        this.bootromEnabled = false;
        for (let i = 0; i < 0x100; i++) {
            this.rom[i] = this.romBootromOverlay[i];
        }
    }

    getOamDmaBusValue(): number {
        // TODO: Implement OAM DMA bus conflicts
        return 0xFF;
    }

    read8(addr: number): number {
        if (this.provider.cheatsAddrs[addr]) return this.provider.cheatsValues[addr];

        switch (addr >> 12) {
            case 0x0: // ROM0 - 0###
            // There is no bootrom check to be found here. Bootrom unmapping is done in unmapBootrom().
            case 0x1: // ROM0 - 1###
            case 0x2: // ROM0 - 2###
            case 0x3: // ROM0 - 3###
                if (!this.oamDmaActive) {
                    return this.rom[addr];
                } else {
                    return this.getOamDmaBusValue();
                }
            case 0x4: // ROMX - 4### 
            case 0x5: // ROMX - 5### 
            case 0x6: // ROMX - 6### 
            case 0x7: // ROMX - 7###
                if (!this.oamDmaActive) {
                    return this.rom[(addr & 0x3FFF) + this.romOffset];
                } else {
                    return this.getOamDmaBusValue();
                }
            case 0x8: // VRAM - 8###
            case 0x9: // VRAM - 9###
                if (!this.oamDmaActive) {
                    return this.ppu.read8(addr);
                } else {
                    return this.getOamDmaBusValue();
                }
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                if (!this.oamDmaActive) {
                    return this.mbc.read8(addr);
                } else {
                    return this.getOamDmaBusValue();
                }
            case 0xC: // WRAM0 - C###
                if (!this.oamDmaActive) {
                    return this.wram[addr & 0xFFF];
                } else {
                    return this.getOamDmaBusValue();
                }
            case 0xD: // WRAMX - D###
                if (!this.oamDmaActive) {
                    return this.wram[(addr & 0xFFF) + (this.wramBank * 0x1000)];
                } else {
                    return this.getOamDmaBusValue();
                }
            case 0xE: // Echo RAM - E###
                if (!this.oamDmaActive) {
                    return this.wram[addr & 0xFFF];
                } else {
                    return this.getOamDmaBusValue();
                }
            case 0xF: // ZeroPage - F###
                if (addr >= 0xF000 && addr <= 0xFDFF) {
                    if (!this.oamDmaActive) {
                        return this.wram[(addr & 0xFFF) + (this.wramBank * 0x1000)];
                    }
                }
                else if (addr >= 0xFE00 && addr <= 0xFEFF) {
                    if (addr <= 0xFE9F) {
                        if (!this.oamDmaActive) {
                            return this.ppu.readOam8(addr);
                        } else {
                            return 0xFF;
                        }
                    } else {
                        return 0x00;
                    }
                }

                switch (addr) {
                    case 0xFF00: // JOYP
                        return this.joypad.readHwio8();

                    case 0xFF01: // SB
                    case 0xFF02: // SC
                        return this.serial.readHwio8(addr);

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

                    case 0xFF76: case 0xFF77: // CGB PCM Registers
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

                    case 0xFF51: // HDMA1
                    case 0xFF52: // HDMA2
                    case 0xFF53: // HDMA3
                    case 0xFF54: // HDMA4
                    case 0xFF55: // HDMA5

                    case 0xFF68: // BCPS/BGPI
                    case 0xFF69: // BCPD/BGPD
                    case 0xFF6A: // OCPS/OBPI
                    case 0xFF6B: // OCPD/OBPD
                        return this.ppu.readHwio8(addr);

                    case 0xFF4D: // KEY1
                        let key1Val = 0;
                        key1Val |= this.gb.doubleSpeed << 7;
                        if (this.gb.queueSpeedSwitch) key1Val = bitSet(key1Val, 0);
                        return key1Val;

                    case 0xFF70: // SVBK - WRAM Bank
                        return this.wramBank | 0b11111000;

                    case 0xFF0F: // IF
                    case 0xFFFF: // IE
                        return this.gb.cpu.readHwio8(addr);

                    default:
                        if (addr >= 0xFF00 && addr <= 0xFF7F) {
                            console.log(`UNHANDLED HWIO READ: ${hex(addr, 4)}`);
                        }
                        break;
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
                if (!this.oamDmaActive) {
                    this.mbc.write8(addr, val);
                    this.romOffset = this.mbc.getOffset() & this.romOffsetMask;
                }
                return;
            case 0x8: // VRAM - 8###
            case 0x9: // VRAM - 9###
                if (!this.oamDmaActive) {
                    this.ppu.write8(addr, val);
                }
                return;
            case 0xA: // SRAM - A###
            case 0xB: // SRAM - B###
                if (!this.oamDmaActive) {
                    this.mbc.write8(addr, val);
                }
                return;
            case 0xC: // WRAM0 - C###
                if (!this.oamDmaActive) {
                    this.wram[addr & 0xFFF] = val;
                }
                return;
            case 0xD: // WRAMX - D###
                if (!this.oamDmaActive) {
                    this.wram[(addr & 0xFFF) + (this.wramBank * 0x1000)] = val;
                }
                return;
            case 0xE: // Echo RAM - E###
                if (!this.oamDmaActive) {
                    this.wram[addr & 0xFFF] = val;
                }
                return;
            case 0xF: // ZeroPage - F###
                if (!this.oamDmaActive) {
                    if (addr >= 0xF000 && addr <= 0xFDFF) {
                        this.wram[(addr & 0xFFF) + (this.wramBank * 0x1000)] = val;
                        return;
                    }
                    else if (addr >= 0xFE00 && addr <= 0xFE9F) {
                        this.ppu.writeOam8(addr, val);
                        return;
                    }
                }

                switch (addr) {
                    case 0xFF00: // JOYP
                        this.joypad.writeHwio8(val);
                        return;

                    case 0xFF01: // SB
                    case 0xFF02: // SC
                        // this.serialOut += String.fromCharCode(val);
                        this.serial.writeHwio8(addr, val);
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

                    case 0xFF51: // HDMA1
                    case 0xFF52: // HDMA2
                    case 0xFF53: // HDMA3
                    case 0xFF54: // HDMA4
                    case 0xFF55: // HDMA5

                    case 0xFF68: // BCPS/BGPI
                    case 0xFF69: // BCPD/BGPD
                    case 0xFF6A: // OCPS/OBPI
                    case 0xFF6B: // OCPD/OBPD
                        this.ppu.writeHwio8(addr, val);
                        return;

                    case 0xFF4D: // KEY1
                        this.gb.queueSpeedSwitch = bitTest(val, 0);
                        return;

                    case 0xFF70: // SVBK - WRAM Bank
                        this.wramBank = val & 0b111;
                        if (this.wramBank == 0) {
                            this.wramBank = 1;
                        }
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

                    default:
                        if (addr >= 0xFF00 && addr <= 0xFF7F) {
                            console.log(`UNHANDLED HWIO WRITE: ${hex(addr, 4)}`);
                        }
                        break;
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