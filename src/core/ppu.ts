import { GameBoy } from './gameboy';
import { BackendFlags } from '../../lib/imgui-js/imgui';
import { bitTest, bitSet } from './util/bits';

export enum PPUMode {
    Hblank = 0,
    Vblank = 1,
    OamScan = 2,
    Drawing = 3,
}

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


    scx = 0; // FF42
    scy = 0; // FF43

    ly = 0; // FF44

    // FF40 - LCDC
    lcdDisplayEnable = false;
    windowTilemapSelect = false;
    windowEnable = false;
    bgWindowTiledataSelect = false;
    bgTilemapSelect = false;
    objSize = false;
    objEnable = false;
    bgWindowEnable = false;

    // FF41
    enableLycIntr = false;
    enableMode2Intr = false;
    enableMode1Intr = false;
    enableMode0Intr = false;
    lyMatch = false;
    mode: PPUMode = 0;

    enterMode2() { // Enter OAM Scan
        this.mode = PPUMode.OamScan;
        this.gb.scheduler.addEventRelative(80, this.endMode2Bound);
    }
    endMode2Bound = this.endMode2.bind(this);
    endMode2() { // OAM Scan -> Drawing
        this.mode = PPUMode.Drawing;
        this.gb.scheduler.addEventRelative(172, this.endMode3Bound);
    }
    endMode3Bound = this.endMode3.bind(this);
    endMode3() { // Drawing -> Hblank
        this.mode = PPUMode.Hblank;
        this.gb.scheduler.addEventRelative(204, this.endMode0Bound);
    }
    endMode0Bound = this.endMode0.bind(this);
    endMode0() { // Hblank -> Vblank / OAM Scan
        this.ly++;
        if (this.ly < 144) {
            this.enterMode2();
        } else {
            this.enterMode1();
        }
    }
    enterMode1() { // Enter Vblank
        this.mode = PPUMode.Vblank;
        this.gb.scheduler.addEventRelative(456, this.continueMode1Bound);
    }
    continueMode1Bound = this.continueMode1.bind(this);
    continueMode1() {// During Vblank
        this.ly++;
        if (this.ly < 154) {
            this.gb.scheduler.addEventRelative(456, this.continueMode1Bound);
        } else { // this.ly >= 153
            this.ly = 0;
            this.enterMode2();
        }
    }

    onEnable() {
        this.enterMode2();
    }

    read8(addr: number): number {
        addr -= 0x8000;
        return this.vram[this.vramBank][addr];
    }
    write8(addr: number, val: number): void {
        addr -= 0x8000;
        this.vram[this.vramBank][addr] = val;
        return;
    };

    readHwio8(addr: number): number {
        let val = 0;
        switch (addr) {
            case 0xFF40:
                if (this.lcdDisplayEnable) val = bitSet(val, 7);
                if (this.windowTilemapSelect) val = bitSet(val, 6);
                if (this.windowEnable) val = bitSet(val, 5);
                if (this.bgWindowTiledataSelect) val = bitSet(val, 4);
                if (this.bgTilemapSelect) val = bitSet(val, 3);
                if (this.objSize) val = bitSet(val, 2);
                if (this.objEnable) val = bitSet(val, 1);
                if (this.bgWindowEnable) val = bitSet(val, 0);
                break;
            case 0xFF41:
                if (this.enableLycIntr) val = bitSet(val, 6);
                if (this.enableMode2Intr) val = bitSet(val, 5);
                if (this.enableMode1Intr) val = bitSet(val, 4);
                if (this.enableMode0Intr) val = bitSet(val, 3);
                if (this.lyMatch) val = bitSet(val, 2);
                val |= this.mode & 0b11;
                break;
            case 0xFF42:
                return this.scy;
            case 0xFF43:
                return this.scx;
            case 0xFF44:
                return this.ly;
            default:
                return 0xFF;
        }
        return val;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF40:
                this.lcdDisplayEnable = bitTest(val, 7);
                this.windowTilemapSelect = bitTest(val, 6);
                this.windowEnable = bitTest(val, 5);
                this.bgWindowTiledataSelect = bitTest(val, 4);
                this.bgTilemapSelect = bitTest(val, 3);
                this.objSize = bitTest(val, 2);
                this.objEnable = bitTest(val, 1);
                this.bgWindowEnable = bitTest(val, 0);
                if (this.lcdDisplayEnable) this.onEnable();
                break;
            case 0xFF41:
                this.enableLycIntr = bitTest(val, 6);
                this.enableMode2Intr = bitTest(val, 5);
                this.enableMode1Intr = bitTest(val, 4);
                this.enableMode0Intr = bitTest(val, 3);
                return;
            case 0xFF42:
                this.scy = val;
                return;
            case 0xFF43:
                this.scx = val;
                return;
            default:
                return;
        }
    }
}