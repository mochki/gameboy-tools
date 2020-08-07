import { SchedulerId, SchedulerEvent, Scheduler } from './scheduler';
import { GameBoy } from './gameboy';
import { BackendFlags } from '../lib/imgui-js/imgui';
import { bitTest, bitSet } from './util/bits';
import { unTwo8b } from './util/misc';
import { InterruptId } from './interrupts';

export enum PPUMode {
    Hblank = 0,
    Vblank = 1,
    OamScan = 2,
    Drawing = 3,
}

export const colors555: Uint8Array[] = [
    new Uint8Array([0xFF >> 3, 0xFF >> 3, 0xFF >> 3]),
    new Uint8Array([0xC0 >> 3, 0xC0 >> 3, 0xC0 >> 3]),
    new Uint8Array([0x60 >> 3, 0x60 >> 3, 0x60 >> 3]),
    new Uint8Array([0x00 >> 3, 0x00 >> 3, 0x00 >> 3]),
];

const RGB_5_TO_8 = [0, 5, 8, 11, 16, 22, 28, 36, 43, 51, 59, 67, 77, 87, 97, 107, 119, 130, 141, 153, 166, 177, 188, 200, 209, 221, 230, 238, 245, 249, 252, 255];
class PaletteData {
    data = new Uint8Array(64).fill(0xFF);

    shades: Uint32Array[] = new Array(8).fill(0).map(() => new Uint32Array(4));

    constructor() {
        this.updateAll();
    }

    update(pal: number, col: number) {
        const b0 = this.data[(pal * 8) + (col * 2) + 0];
        const b1 = this.data[(pal * 8) + (col * 2) + 1];

        const rgb555 = (b1 << 8) | b0;

        const r = ((rgb555 >> 0) & 31);
        const g = ((rgb555 >> 5) & 31);
        const b = ((rgb555 >> 10) & 31);

        this.shades[pal][col] = (r << 11) | (g << 6) | (b << 0);
    }

    updateAll() {
        for (let pal = 0; pal < 8; pal++) {
            for (let col = 0; col < 4; col++) {
                this.update(pal, col);
            }
        }
    }
}

type SpriteData = {
    x: number,
    // y: number,
    tileDataUpper: number,
    tileDataLower: number,

    bgPriority: boolean; // 7
    // yFlip: boolean; // 6
    xFlip: boolean; // 5
    dmgPalette: boolean; // 4
    cgbVramBank: boolean; // 3
    cgbPalette: number;
};

function spriteXCompare(a: SpriteData, b: SpriteData) {
    return a.x - b.x;
}

export class PPU {
    gb: GameBoy;
    scheduler: Scheduler;

    constructor(gb: GameBoy, scheduler: Scheduler) {
        this.gb = gb;
        this.scheduler = scheduler;
    }

    scanlineTimingsBack = new Uint32Array(144);
    scanlineTimingsFront = new Uint32Array(144);

    bgPalette = new PaletteData();
    objPalette = new PaletteData();

    dmgBgPalette = 0;
    dmgObj0Palette = 0;
    dmgObj1Palette = 0;

    screenBackBuf = new Uint16Array(160 * 144);
    screenFrontBuf = new Uint16Array(160 * 144);
    renderDoneScreen = true;
    renderDoneTimingDiagram = true;
    scanlineRaw = new Uint8Array(160);

    vram = [
        new Uint8Array(0x2000),
        new Uint8Array(0x2000)
    ];
    vramBank = 0;

    oam = new Uint8Array(160);

    tileset = [
        new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // Bank 0
        new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // Bank 1
    ];
    tilemap = new Uint8Array(2048);

    scx = 0; // FF42
    scy = 0; // FF43

    ly = 0; // FF44

    lyc = 0; // FF45

    wy = 0; // FF4A
    wx = 0; // FF4B

    windowCurrentLine = 0;
    windowTriggeredThisFrame = false;

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

    mode3StartCycles = 0;

    swapBuffers() {
        let tempScreenBuf = this.screenBackBuf;
        this.screenBackBuf = this.screenFrontBuf;
        this.screenFrontBuf = tempScreenBuf;

        let tempScanlineTimings = this.scanlineTimingsBack;
        this.scanlineTimingsBack = this.scanlineTimingsFront;
        this.scanlineTimingsFront = tempScanlineTimings;
    }

    enterMode2 = (cyclesLate: number) => { // Enter OAM Scan
        if (this.ly != 0) {
            this.mode = PPUMode.OamScan;
            this.checkStat();
        } else {
            this.scheduler.addEventRelative(SchedulerId.PPUMode, 4 - cyclesLate, this.enterMode2Late);
        }
        this.scheduler.addEventRelative(SchedulerId.PPUMode, 80 - cyclesLate, this.endMode2);
    };

    enterMode2Late = (cyclesLate: number) => {
        this.mode = PPUMode.OamScan;
        this.checkStat();
    };

    endMode2 = (cyclesLate: number) => { // OAM Scan -> Drawing
        this.fetcherOamScan();
        this.fetcherReset();

        this.mode = PPUMode.Drawing;
        this.checkStat();
        let mode3Extra = 0;
        mode3Extra += this.scx & 0b111;
        this.scheduler.addEventRelative(SchedulerId.PPUMode, 172 + mode3Extra - cyclesLate, this.endMode3);
        this.mode3StartCycles = this.scheduler.currTicks - cyclesLate;
    };

    endMode3 = (cyclesLate: number) => { // Drawing -> Hblank
        // this.renderScanline();
        this.mode = PPUMode.Hblank;
        this.checkStat();
        this.scheduler.addEventRelative(SchedulerId.PPUMode, 204 - cyclesLate, this.endMode0);

        while (this.fetcherX < 160) {
            this.fetcherAdvance(8);
        }

        this.scanlineTimingsBack[this.ly] = this.fetcherCycles;
        this.fetcherCycles = 0;
    };

    endMode0 = (cyclesLate: number) => { // Hblank -> Vblank / OAM Scan
        this.ly++;
        this.checkStat();

        if (this.ly < 144) {
            this.enterMode2(0); // OAM Scan
        } else {
            this.enterMode1(0); // Vblank
            this.renderDoneScreen = true;
            this.renderDoneTimingDiagram = true;
            this.swapBuffers();
            this.windowTriggeredThisFrame = false;
        }
    };

    enterMode1 = (cyclesLate: number) => { // Enter Vblank
        this.scheduler.addEventRelative(SchedulerId.PPUMode, 4 - cyclesLate, this.enterMode1LateEffects);
        this.scheduler.addEventRelative(SchedulerId.PPUMode, 456 - cyclesLate, this.continueMode1);
    };

    enterMode1LateEffects = (cyclesLate: number) => {
        this.mode = PPUMode.Vblank;
        this.checkStat();
        this.gb.cpu.flagInterrupt(InterruptId.Vblank);
    };

    continueMode1 = (cyclesLate: number) => { // During Vblank
        this.ly++;
        this.checkStat();

        if (this.ly == 153) {
            this.scheduler.addEventRelative(SchedulerId.PPUMode, 4 - cyclesLate, this.line153Quirk);
            this.scheduler.addEventRelative(SchedulerId.PPUMode, 456 - cyclesLate, this.enterMode2);

            return;
        }

        if (this.ly < 153) {
            this.scheduler.addEventRelative(SchedulerId.PPUMode, 456 - cyclesLate, this.continueMode1);
        }
    };

    line153Quirk = (cyclesLate: number) => {
        this.ly = 0;
        this.checkStat();
    };

    onEnable() {
        this.enterMode2(0);
        this.mode = PPUMode.OamScan;
        this.checkStat();
    }
    onDisable() {
        this.scheduler.cancelEventsById(SchedulerId.PPUMode);
        this.ly = 0;
        this.mode = PPUMode.Hblank;
        this.checkStat();
    }

    previousStatCondition = false;

    checkStat() {
        this.lyMatch = this.ly == this.lyc;
        let currentCondition =
            (this.ly == this.lyc && this.enableLycIntr) ||
            (this.mode == PPUMode.Hblank && this.enableMode0Intr) ||
            (this.mode == PPUMode.Vblank && this.enableMode1Intr) ||
            (this.mode == PPUMode.OamScan && this.enableMode2Intr);

        if (!this.previousStatCondition && currentCondition) {
            this.gb.cpu.flagInterrupt(InterruptId.Stat);
        }

        this.previousStatCondition = currentCondition;
    }

    read8(addr: number): number {
        if (this.mode == PPUMode.Drawing) return 0xFF;

        addr &= 0x1FFF;
        return this.vram[this.vramBank][addr];
    }
    write8(addr: number, val: number): void {
        if (this.mode == PPUMode.Drawing) return;

        addr &= 0x1FFF;

        if (this.vram[this.vramBank][addr] != val) {
            this.vram[this.vramBank][addr] = val;

            const tile = addr >> 4;

            // Write to tile set
            if (addr >= 0x0000 && addr < 0x1800) {
                let adjAddr = addr & 0xFFFE;

                // Work out which tile and row was updated
                const y = (addr & 0xF) >> 1;

                for (let x = 0; x < 8; x++) {
                    // Find bit index for this pixel
                    const byte0 = this.vram[this.vramBank][adjAddr];
                    const byte1 = this.vram[this.vramBank][adjAddr + 1];

                    const mask = 0b1 << (7 - x);
                    const lsb = byte0 & mask;
                    const msb = byte1 & mask;

                    // Update tile set
                    this.tileset[this.vramBank][tile][y][x] =
                        (lsb !== 0 ? 1 : 0) +
                        (msb !== 0 ? 2 : 0);
                }
            }

            if (this.vramBank == 0) {
                // Write to tile map
                if (addr >= 0x1800 && addr < 0x2000) {
                    if (this.tilemap[addr - 0x1800] !== val) {
                        this.tilemap[addr - 0x1800] = val;
                    }
                }
            } else if (this.vramBank == 1) {
                // // Write to CGB tile flags
                // if (index >= 0x1800 && index < 0x2000) {
                //     this.cgbTileAttrs[index - 0x1800].setNumerical(value);
                // }
            }
        }
        return;
    }



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
            case 0xFF45:
                return this.lyc;
            case 0xFF47: // BG Palette
                return this.dmgBgPalette;
            case 0xFF48: // OBJ 0 Palette 
                return this.dmgObj0Palette;
            case 0xFF49: // OBJ 1 Palette 
                return this.dmgObj1Palette;
            case 0xFF4A: // WY
                return this.wy;
            case 0xFF4B: // WX
                return this.wx;
            default:
                return 0xFF;
        }
        return val;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF40:
                this.catchup();
                if (this.lcdDisplayEnable && !bitTest(val, 7)) this.onDisable();
                if (!this.lcdDisplayEnable && bitTest(val, 7)) this.onEnable();
                this.lcdDisplayEnable = bitTest(val, 7);
                this.windowTilemapSelect = bitTest(val, 6);
                this.windowEnable = bitTest(val, 5);
                this.bgWindowTiledataSelect = bitTest(val, 4);
                this.bgTilemapSelect = bitTest(val, 3);
                this.objSize = bitTest(val, 2);
                this.objEnable = bitTest(val, 1);
                this.bgWindowEnable = bitTest(val, 0);
                break;
            case 0xFF41:
                this.enableLycIntr = bitTest(val, 6);
                this.enableMode2Intr = bitTest(val, 5);
                this.enableMode1Intr = bitTest(val, 4);
                this.enableMode0Intr = bitTest(val, 3);
                this.checkStat();
                return;
            case 0xFF42:
                this.catchup();
                this.scy = val;
                return;
            case 0xFF43:
                this.catchup();
                this.scx = val;
                return;
            case 0xFF45:
                this.lyc = val;
                this.checkStat();
                return;
            case 0xFF46: // OAM DMA
                this.oamDma(val);
                return;
            case 0xFF47: // BG Palette
                this.catchup();
                this.dmgBgPalette = val;
                if (this.gb.cgb == false) {
                    this.setDmgBgPalette(0, (val >> 0) & 0b11);
                    this.setDmgBgPalette(1, (val >> 2) & 0b11);
                    this.setDmgBgPalette(2, (val >> 4) & 0b11);
                    this.setDmgBgPalette(3, (val >> 6) & 0b11);
                }
                return;
            case 0xFF48: // OBJ 0 Palette 
                this.dmgObj0Palette = val;
                if (this.gb.cgb == false) {
                    this.setDmgObjPalette(0, (val >> 0) & 0b11);
                    this.setDmgObjPalette(1, (val >> 2) & 0b11);
                    this.setDmgObjPalette(2, (val >> 4) & 0b11);
                    this.setDmgObjPalette(3, (val >> 6) & 0b11);
                }
                break;
            case 0xFF49: // OBJ 1 Palette 
                this.dmgObj1Palette = val;
                if (this.gb.cgb == false) {
                    this.setDmgObjPalette(4, (val >> 0) & 0b11);
                    this.setDmgObjPalette(5, (val >> 2) & 0b11);
                    this.setDmgObjPalette(6, (val >> 4) & 0b11);
                    this.setDmgObjPalette(7, (val >> 6) & 0b11);
                }
                break;
            case 0xFF4A: // WY
                this.catchup();
                this.wy = val;
                return;
            case 0xFF4B: // WX
                this.catchup();
                this.wx = val;
                return;
            default:
                return;
        }
    }

    readOam8(addr: number): number {
        if (this.mode == PPUMode.OamScan) return 0xFF;
        if (this.mode == PPUMode.Drawing) return 0xFF;

        return this.oam[addr - 0xFE00];
    }
    writeOam8(addr: number, val: number) {
        if (this.mode == PPUMode.OamScan) return;
        if (this.mode == PPUMode.Drawing) return;

        this.oam[addr - 0xFE00] = val;
    }

    setDmgBgPalette(palette: number, color: number) {
        const i = palette * 2;
        const c = colors555[color];
        const cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        const upper = (cv >> 8) & 0xFF;
        const lower = cv & 0xFF;

        this.bgPalette.data[i + 1] = upper;
        this.bgPalette.data[i + 0] = lower;

        this.bgPalette.update(0, palette);
    }

    setDmgObjPalette(palette: number, color: number) {
        const i = palette * 2;
        const c = colors555[color];
        const cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        const upper = (cv >> 8) & 0xFF;
        const lower = cv & 0xFF;

        this.objPalette.data[i + 0] = lower;
        this.objPalette.data[i + 1] = upper;

        this.objPalette.update(palette >> 2, palette & 3);
    }

    renderScanline() {
        let screenBase = this.ly * 160;
        let windowPixel = this.wx - 7;
        if (this.bgWindowEnable) {
            {
                let tilemapBase = (this.bgTilemapSelect ? 1024 : 0) + ((((this.scy + this.ly) >> 3) << 5) & 1023);
                let lineOffset = this.scx >> 3;

                let pixel = -(this.scx & 0b111);
                let tileY = (this.scy + this.ly) & 7;

                bgLoop:
                for (let t = 0; ; t++) {
                    let tilemapAddr = tilemapBase + ((lineOffset + t) & 31);
                    let tileIndex = this.tilemap[tilemapAddr];

                    if (!this.bgWindowTiledataSelect) {
                        // On high tileset, the tile number is signed with Two's complement
                        tileIndex = unTwo8b(tileIndex) + 256;
                    }

                    let data = this.tileset[0][tileIndex][tileY];
                    let palette = this.bgPalette.shades[0];
                    // tp; tile pixel
                    // #region LOOP
                    // for (let tp = 0; tp < 8; tp++) {
                    //     if (pixel >= 0) {
                    //         this.screenBackBuf[screenBase] = palette[data[tp]];
                    //         this.scanlineRaw[pixel] = data[tp];
                    //         screenBase += 1;
                    //     }
                    //     pixel += 1;

                    //     if (pixel > 159) break bgLoop;
                    // }
                    // #endregion
                    // #region UNROLL
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[0]];
                        this.scanlineRaw[pixel] = data[0];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[1]];
                        this.scanlineRaw[pixel] = data[1];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[2]];
                        this.scanlineRaw[pixel] = data[2];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[3]];
                        this.scanlineRaw[pixel] = data[3];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[4]];
                        this.scanlineRaw[pixel] = data[4];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[5]];
                        this.scanlineRaw[pixel] = data[5];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[6]];
                        this.scanlineRaw[pixel] = data[6];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    if (pixel >= 0) {
                        this.screenBackBuf[screenBase] = palette[data[7]];
                        this.scanlineRaw[pixel] = data[7];
                        screenBase += 1;
                    }
                    pixel += 1;
                    if (pixel > 159) break bgLoop;
                    // #endregion
                }
            }
            if (this.windowEnable) {
                if (this.ly >= this.wy && windowPixel < 160) {
                    if (!this.windowTriggeredThisFrame) {
                        this.windowTriggeredThisFrame = true;
                        this.windowCurrentLine = this.ly - this.wy;
                    }

                    let tilemapBase = (this.windowTilemapSelect ? 1024 : 0) + (((this.windowCurrentLine >> 3) << 5) & 1023);
                    let lineOffset = 0;

                    screenBase = (this.ly * 160) + windowPixel;
                    let tileY = this.windowCurrentLine & 7;

                    windowLoop:
                    for (let t = 0; ; t++) {
                        let tilemapAddr = tilemapBase + ((lineOffset + t) & 31);
                        let tileIndex = this.tilemap[tilemapAddr];

                        if (!this.bgWindowTiledataSelect) {
                            // On high tileset, the tile number is signed with Two's complement
                            tileIndex = unTwo8b(tileIndex) + 256;
                        }

                        let data = this.tileset[0][tileIndex][tileY];
                        let palette = this.bgPalette.shades[0];
                        // tp; tile pixel
                        // #region LOOP
                        // for (let tp = 0; tp < 8; tp++) {
                        //     if (windowPixel >= 0) {
                        //         this.screenBackBuf[screenBase] = palette[data[tp]];
                        //         this.scanlineRaw[windowPixel] = data[tp];
                        //     }
                        //     screenBase += 1;
                        //     windowPixel += 1;
                        //     if (windowPixel > 159) break windowLoop;
                        // }
                        // #endregion
                        // #region UNROLL
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[0]];
                            this.scanlineRaw[windowPixel] = data[0];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[1]];
                            this.scanlineRaw[windowPixel] = data[1];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[2]];
                            this.scanlineRaw[windowPixel] = data[2];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[3]];
                            this.scanlineRaw[windowPixel] = data[3];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[4]];
                            this.scanlineRaw[windowPixel] = data[4];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[5]];
                            this.scanlineRaw[windowPixel] = data[5];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[6]];
                            this.scanlineRaw[windowPixel] = data[6];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase] = palette[data[7]];
                            this.scanlineRaw[windowPixel] = data[7];
                        }
                        screenBase += 1;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                        // #endregion
                    }

                    this.windowCurrentLine++;
                }
            }
        } else {
            for (let p = 0; p < 160; p++) {
                this.screenBackBuf[screenBase] = 0xFFFF;
                this.scanlineRaw[p] = 0;
                screenBase += 1;
            }
        }

        let displayObjs = this.objEnable;

        if (displayObjs) {
            let spriteCount = 0;
            let oamAddr = 0;
            for (let s = 0; s < 40; s++) {
                let yPos = this.oam[oamAddr + 0];
                let screenYStart = yPos - 16;

                if (this.ly >= screenYStart && this.ly < screenYStart + (this.objSize ? 16 : 8)) {
                    spriteCount++;
                    if (spriteCount > 10) return;

                    let xPos = this.oam[oamAddr + 1];
                    let tileIndex = this.oam[oamAddr + 2];
                    let flags = this.oam[oamAddr + 3];

                    let bgPriority = bitTest(flags, 7);
                    let yFlip = bitTest(flags, 6);
                    let xFlip = bitTest(flags, 5);
                    let dmgPalette = bitTest(flags, 4);
                    let cgbVramBank = bitTest(flags, 3);
                    let cgbPalette = flags & 0b111;

                    let screenX = xPos - 8;
                    screenBase = (this.ly * 160) + screenX;

                    let spriteY = this.ly - screenYStart;
                    let tileY = spriteY & 0b111;
                    if (this.objSize) {
                        tileIndex &= 0xFE; // Erase low bit for tall sprites
                        if (yFlip) {
                            if (spriteY <= 7) {
                                tileIndex++; // Double height sprites
                            }
                        } else {
                            if (spriteY > 7) {
                                tileIndex++; // Double height sprites
                            }
                        }

                    }
                    if (yFlip) {
                        tileY ^= 0b111;
                    }
                    let tileData = this.tileset[0][tileIndex][tileY];

                    let palette = this.objPalette.shades[dmgPalette ? 1 : 0];

                    // #region LOOP
                    // if (xFlip) {
                    //     for (let px = 7; px >= 0; px--) {
                    //         let prePalette = tileData[px];
                    //         if (screenX >= 0 && prePalette != 0) {
                    //             if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                    //                 this.screenBackBuf[screenBase] = palette[prePalette];
                    //             }
                    //         }
                    //         screenBase += 1;
                    //         screenX++;
                    //     }
                    // } else {
                    //     for (let px = 0; px < 8; px++) {
                    //         let prePalette = tileData[px];
                    //         if (screenX >= 0 && prePalette != 0) {
                    //             if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                    //                 this.screenBackBuf[screenBase] = palette[prePalette];
                    //             }
                    //         }
                    //         screenBase += 1;
                    //         screenX++;
                    //     }
                    // }
                    // #endregion
                    // #region UNROLL
                    if (xFlip) {
                        let prePalette = tileData[7];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[6];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[5];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[4];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[3];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[2];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[1];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[0];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                    } else {
                        let prePalette = tileData[0];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[1];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[2];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[3];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[4];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[5];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[6];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                        prePalette = tileData[7];
                        if (screenX >= 0 && prePalette != 0) {
                            if (!bgPriority || this.scanlineRaw[screenX] == 0) {
                                this.screenBackBuf[screenBase] = palette[prePalette];
                            }
                        }
                        screenBase += 1;
                        screenX += 1;
                    }
                    // #endregion
                }

                oamAddr += 4;
            }
        }
    }

    catchup() {
        if (this.mode == PPUMode.Drawing) {
            let current = this.scheduler.currTicks;
            let diff = current - this.mode3StartCycles;
            this.mode3StartCycles = current;

            this.fetcherAdvance(diff);
        }
    }

    fetcherSprite = 0;
    fetcherSpriteCount = 0;
    fetcherSpriteNextX = 0;
    fetcherSpriteData: SpriteData[] = new Array(10).fill(0).map(() => {
        return {
            x: 0,
            // y: 0,
            tileDataUpper: 0,
            tileDataLower: 0,

            bgPriority: false,
            // yFlip: false,
            xFlip: false,
            dmgPalette: false,
            cgbVramBank: false,
            cgbPalette: 0
        };
    });

    fetcherOamScan() {
        let spriteCount = 0;
        let oamAddr = 0;
        for (let s = 0; s < 40; s++) {

            let yPos = this.oam[oamAddr + 0];
            let screenYStart = yPos - 16;

            if (this.ly >= screenYStart && this.ly < screenYStart + (this.objSize ? 16 : 8)) {

                let xPos = this.oam[oamAddr + 1];
                let tileIndex = this.oam[oamAddr + 2];
                let flags = this.oam[oamAddr + 3];

                let data = this.fetcherSpriteData[spriteCount];

                data.x = xPos - 8;
                // data.y = yPos;

                data.bgPriority = bitTest(flags, 7);
                let yFlip = bitTest(flags, 6);
                data.xFlip = bitTest(flags, 5);
                data.dmgPalette = bitTest(flags, 4);
                data.cgbVramBank = bitTest(flags, 3);
                data.cgbPalette = flags & 0b111;

                let spriteY = this.ly - screenYStart;
                let tileY = spriteY & 0b111;
                if (this.objSize) {
                    tileIndex &= 0xFE; // Erase low bit for tall sprites
                    if (yFlip) {
                        if (spriteY <= 7) {
                            tileIndex++; // Double height sprites
                        }
                    } else {
                        if (spriteY > 7) {
                            tileIndex++; // Double height sprites
                        }
                    }
                }
                if (yFlip) {
                    tileY ^= 0b111;
                }
                let tiledataAddr = (tileIndex * 16) + (tileY * 2);
                data.tileDataLower = this.vram[0][tiledataAddr + 0];
                data.tileDataUpper = this.vram[0][tiledataAddr + 1];
                spriteCount++;
                if (spriteCount >= 10) break;
            }

            oamAddr += 4;
        }
        for (let s = spriteCount; s < 10; s++) {
            this.fetcherSpriteData[s].x = 0xFF;
        }
        this.fetcherSpriteData.sort(spriteXCompare);
        this.fetcherSpriteNextX = this.fetcherSpriteData[0].x;
        this.fetcherSpriteCount = spriteCount;
    }

    fetcherStep = 0;
    fetcherX = 0;
    fetcherTile = -1;
    fetcherTileIndex = 0;
    fetcherTileDataUpper = 0;
    fetcherTileDataLower = 0;
    fetcherPushReady = false;
    fetcherBgWindowShiftUpper = 0;
    fetcherBgWindowShiftLower = 0;
    fetcherBgWindowShiftFilled = 0;
    fetcherObjShiftUpper = 0;
    fetcherObjShiftLower = 0;
    fetcherObjShiftPal = 0;
    fetcherObjShiftBgPrio = 0;
    fetcherWindow = false;
    fetcherStall = 0;
    fetcherCycles = 0;
    fetcherAdvance(cycles: number) {
        while (cycles > 0) {
            if (this.fetcherX < 160) {
                if (this.fetcherStall > 0) {
                    this.fetcherStall--;
                } else {
                    if (!this.fetcherPushReady) {
                        switch (this.fetcherStep) {
                            case 0: // Fetch tile number
                                if (!this.fetcherWindow) {
                                    let tilemapBase = (this.bgTilemapSelect ? 1024 : 0) + ((((this.scy + this.ly) >> 3) << 5) & 1023);
                                    let lineOffset = this.scx >> 3;
                                    let tilemapAddr = tilemapBase + ((lineOffset + this.fetcherTile) & 31);
                                    this.fetcherTile++;
                                    this.fetcherTileIndex = this.tilemap[tilemapAddr];
                                } else {
                                    let tilemapBase = (this.windowTilemapSelect ? 1024 : 0) + (((this.windowCurrentLine >> 3) << 5) & 1023);
                                    let tilemapAddr = tilemapBase + (this.fetcherTile & 31);
                                    this.fetcherTile++;
                                    this.fetcherTileIndex = this.tilemap[tilemapAddr];
                                }

                                if (!this.bgWindowTiledataSelect) {
                                    // On high tileset, the tile number is signed with two's complement
                                    this.fetcherTileIndex = unTwo8b(this.fetcherTileIndex) + 256;
                                }

                                this.fetcherStep++;
                                break;
                            case 1: // Delay
                            case 2:
                            case 3:
                            case 4:
                                this.fetcherStep++;
                                break;
                            case 5:
                                let tileY;
                                if (!this.fetcherWindow) {
                                    tileY = (this.scy + this.ly) & 7;
                                } else {
                                    tileY = this.windowCurrentLine & 7;
                                }
                                let tiledataAddr = (this.fetcherTileIndex * 16) + (tileY * 2);
                                let lower = this.vram[0][tiledataAddr + 0];
                                let upper = this.vram[0][tiledataAddr + 1];
                                // Evil bit-level magic to reverse bits in a byte
                                this.fetcherTileDataLower = lower = ((lower * 0x0802 & 0x22110) | (lower * 0x8020 & 0x88440)) * 0x10101 >> 16;
                                this.fetcherTileDataUpper = upper = ((upper * 0x0802 & 0x22110) | (upper * 0x8020 & 0x88440)) * 0x10101 >> 16;
                                this.fetcherPushReady = true;
                                this.fetcherStep = 0;
                                break;
                        }
                    } else {
                        if ((this.fetcherBgWindowShiftFilled & 0xFF) == 0) {
                            this.fetcherPushReady = false;
                            this.fetcherBgWindowShiftLower = this.fetcherTileDataLower;
                            this.fetcherBgWindowShiftUpper = this.fetcherTileDataUpper;
                            this.fetcherBgWindowShiftFilled = 0xFF;
                        }
                    }

                    if ((this.fetcherBgWindowShiftFilled & 0xFF) != 0) {
                        if (this.fetcherX < 160) {
                            if (this.fetcherX >= 0) {
                                let bgWindowPixelUpper = this.fetcherBgWindowShiftUpper & 1;
                                let bgWindowPixelLower = this.fetcherBgWindowShiftLower & 1;
                                let bgWindowCol = (bgWindowPixelUpper << 1) | bgWindowPixelLower;

                                let screenBase = (this.ly * 160) + this.fetcherX;
                                if (this.bgWindowEnable) {
                                    this.screenBackBuf[screenBase] = this.bgPalette.shades[0][bgWindowCol];
                                } else {
                                    this.screenBackBuf[screenBase] = 0xFFFF;
                                }

                                let objPixelUpper = this.fetcherObjShiftUpper & 1;
                                let objPixelLower = this.fetcherObjShiftLower & 1;
                                let objCol = (objPixelUpper << 1) | objPixelLower;

                                if (objCol != 0) {
                                    let palette = this.objPalette.shades[this.fetcherObjShiftPal & 1];
                                    let priority = this.fetcherObjShiftBgPrio & 1;
                                    if (!priority || bgWindowCol == 0) {
                                        this.screenBackBuf[screenBase] = palette[objCol];
                                    }
                                }

                                this.fetcherObjShiftUpper >>= 1;
                                this.fetcherObjShiftLower >>= 1;
                                this.fetcherObjShiftPal >>= 1;
                                this.fetcherObjShiftBgPrio >>= 1;

                                if (this.fetcherX == this.wx - 8 && this.windowEnable && this.ly >= this.wy) {
                                    // Window trigger
                                    if (!this.windowTriggeredThisFrame) {
                                        this.windowTriggeredThisFrame = true;
                                        this.windowCurrentLine = this.ly - this.wy;
                                    } else {
                                        this.windowCurrentLine++;
                                    }
                                    this.fetcherStep = 0;
                                    this.fetcherPushReady = false;
                                    this.fetcherTile = 0;
                                    this.fetcherWindow = true;
                                    this.fetcherBgWindowShiftFilled = 0;
                                }

                                if (this.objEnable) {
                                    while (this.fetcherX == this.fetcherSpriteNextX - 1) {
                                        this.fetcherSpriteFetch(0);
                                    }
                                }
                            }
                            this.fetcherBgWindowShiftUpper >>= 1;
                            this.fetcherBgWindowShiftLower >>= 1;
                            this.fetcherBgWindowShiftFilled >>= 1;
                            this.fetcherX++;
                        }
                    }
                }
                this.fetcherCycles += 1;
            }
            cycles--;
        }
    }

    fetcherReset() {
        this.fetcherStep = 0;
        this.fetcherX = -(this.scx & 0b111);
        this.fetcherPushReady = false;
        this.fetcherTile = 0;
        this.fetcherStall = 6;
        this.fetcherWindow = false;
        this.fetcherSprite = 0;

        // Reset Shifts
        this.fetcherObjShiftUpper = 0;
        this.fetcherObjShiftLower = 0;
        this.fetcherObjShiftPal = 0;
        this.fetcherObjShiftBgPrio = 0;

        this.fetcherBgWindowShiftLower = 0;
        this.fetcherBgWindowShiftUpper = 0;
        this.fetcherBgWindowShiftFilled = 0;

        // Special window trigger case
        if (this.windowEnable && this.ly >= this.wy && this.wx < 8) {
            if (!this.windowTriggeredThisFrame) {
                this.windowTriggeredThisFrame = true;
                this.windowCurrentLine = this.ly - this.wy;
            } else {
                this.windowCurrentLine++;
            }
            this.fetcherWindow = true;
            this.fetcherX = -(this.wx - 7);
        }

        if (this.objEnable) {
            while (this.fetcherSpriteNextX <= 0) {
                let shiftOut = -(this.fetcherSpriteNextX);
                this.fetcherSpriteFetch(shiftOut);
            }
        }
    }

    fetcherSpriteFetch(shiftOut: number) {
        let spriteData = this.fetcherSpriteData[this.fetcherSprite];
        // Sprite trigger
        let pal = spriteData.dmgPalette;
        let priority = spriteData.bgPriority;

        let postUpper = 0;
        let postLower = 0;

        if (!this.fetcherSpriteData[this.fetcherSprite].xFlip) {
            let preUpper = spriteData.tileDataUpper;
            let preLower = spriteData.tileDataLower;

            // Evil bit-level magic to reverse an 8-bit integer
            postUpper = (((preUpper * 0x0802 & 0x22110) | (preUpper * 0x8020 & 0x88440)) * 0x10101 >> 16) & 0xFF;
            postLower = (((preLower * 0x0802 & 0x22110) | (preLower * 0x8020 & 0x88440)) * 0x10101 >> 16) & 0xFF;
        } else {
            postUpper = spriteData.tileDataUpper;
            postLower = spriteData.tileDataLower;
        }

        let dontDraw = this.fetcherObjShiftUpper | this.fetcherObjShiftLower;

        this.fetcherObjShiftUpper = ((this.fetcherObjShiftUpper & dontDraw) | (postUpper & ~dontDraw)) >> shiftOut;
        this.fetcherObjShiftLower = ((this.fetcherObjShiftLower & dontDraw) | (postLower & ~dontDraw)) >> shiftOut;
        this.fetcherObjShiftBgPrio = (priority ? 0xFF : 0) >> shiftOut;
        this.fetcherObjShiftPal = (pal ? 0xFF : 0) >> shiftOut;

        this.fetcherStall += 6;
        this.fetcherSprite++;
        if (this.fetcherSprite < 10) {
            this.fetcherSpriteNextX = this.fetcherSpriteData[this.fetcherSprite].x;
        } else {
            this.fetcherSpriteNextX = 0xFF;
        }
    }

    oamDma(page: number) {
        let startAddr = page << 8;
        for (let i = 0; i < 160; i++) {
            this.oam[i] = this.gb.bus.read8(startAddr + i);
        }
    }
}