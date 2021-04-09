import { SchedulerId, SchedulerEvent, Scheduler } from './scheduler';
import { GameBoy } from './gameboy';
import { BackendFlags, GetTextLineHeightWithSpacing } from '../lib/imgui-js/imgui';
import { bitTest, bitSet, BIT_3, byteFlip } from './util/bits';
import { unTwo8b, hex } from './util/misc';
import { InterruptId } from './interrupts';

export const enum PPUMode {
    Hblank = 0,
    Vblank = 1,
    OamScan = 2,
    Drawing = 3,
    GlitchedOamScan = 4,
}

export const colors555: Uint8Array[] = [
    new Uint8Array([0xFF >> 3, 0xFF >> 3, 0xFF >> 3]),
    new Uint8Array([0xC0 >> 3, 0xC0 >> 3, 0xC0 >> 3]),
    new Uint8Array([0x60 >> 3, 0x60 >> 3, 0x60 >> 3]),
    new Uint8Array([0x00 >> 3, 0x00 >> 3, 0x00 >> 3]),
];

const paletteLookup = generatePaletteLookup(true);
function generatePaletteLookup(enableColorCorrection: boolean) {
    // 32768 colors * 3 bytes each
    let table = new Array(32768).fill(0).map(() => new Uint8Array(3));

    for (let i = 0; i < 32768; i++) {
        let r = (i >> 0) & 0b11111;
        let g = (i >> 5) & 0b11111;
        let b = (i >> 10) & 0b11111;

        let rOut: number;
        let gOut: number;
        let bOut: number;

        if (enableColorCorrection) {
            // Color correction algorithm, as detailed in https://byuu.net/video/color-emulation/
            // Tweaked to Powerlated's liking
            // All factors add up to 31, creating neutral greys.
            rOut = Math.min(240, (r * 28 + g * 2 + b * 1) >> 2);
            gOut = Math.min(240, (r * 2 + g * 23 + b * 6) >> 2);
            bOut = Math.min(240, (r * 4 + g * 4 + b * 23) >> 2);
        } else {
            rOut = r * (255 / 31);
            gOut = g * (255 / 31);
            bOut = b * (255 / 31);
        }

        table[i][0] = rOut;
        table[i][1] = gOut;
        table[i][2] = bOut;
    }

    return table;
}

const RGB_5_TO_8 = [0, 5, 8, 11, 16, 22, 28, 36, 43, 51, 59, 67, 77, 87, 97, 107, 119, 130, 141, 153, 166, 177, 188, 200, 209, 221, 230, 238, 245, 249, 252, 255];
class PaletteData {
    data = new Uint8Array(64).fill(0xFF);

    shades: Uint8Array[][] = new Array(8).fill(0).map(() => [
        new Uint8Array(3),
        new Uint8Array(3),
        new Uint8Array(3),
        new Uint8Array(3),
    ]);

    constructor() {
        this.updateAll();
    }

    update(pal: number, col: number) {
        const b0 = this.data[(pal * 8) + (col * 2) + 0];
        const b1 = this.data[(pal * 8) + (col * 2) + 1];

        const rgb555 = ((b1 << 8) | b0) & 0b111111111111111;

        this.shades[pal][col][0] = paletteLookup[rgb555][0];
        this.shades[pal][col][1] = paletteLookup[rgb555][1];
        this.shades[pal][col][2] = paletteLookup[rgb555][2];
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

    frameSkipRate = 0;
    renderThisFrame = false;
    currentFrame = 0;

    scanlineTimingsBack = new Uint32Array(144);
    scanlineTimingsFront = new Uint32Array(144);

    bgPalette = new PaletteData();
    objPalette = new PaletteData();

    cgbBgPaletteIndex = 0;
    cgbBgPaletteIndexInc = false;
    cgbObjPaletteIndex = 0;
    cgbObjPaletteIndexInc = false;

    dmgBgPalette = 0;
    dmgObj0Palette = 0;
    dmgObj1Palette = 0;

    screenBackBuf = new Uint8Array(160 * 144 * 3);
    screenFrontBuf = new Uint8Array(160 * 144 * 3);
    renderDoneScreen = true;
    renderDoneTimingDiagram = true;
    scanlineRaw = new Uint8Array(160);
    scanlineNoSprites = new Uint8Array(160);

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
    tilesetXFlipped = [
        new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // Bank 0
        new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // Bank 1
    ];
    tilemap = new Uint8Array(2048);
    cgbAttrs = new Uint8Array(2048);

    scx = 0; // FF42
    scy = 0; // FF43

    ly = 0; // FF44

    lyc = 0; // FF45

    wy = 0; // FF4A
    wx = 0; // FF4B

    windowCurrentLine = -1;
    windowYTrigger = false;

    lcdcVal = 0;

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

    fastInitialOamScanSpriteCount = 0;

    previousStatCondition = false;

    fetcherStep = 0;
    fetcherX = 0;
    fetcherTile = -1;
    fetcherTileIndex = 0;
    fetcherTileDataUpper = 0;
    fetcherTileDataLower = 0;
    fetcherPushReady = false;
    fetcherBgWindowShiftUpper = 0;
    fetcherBgWindowShiftLower = 0;
    fetcherBgWindowShiftPal = 0;
    fetcherBgWindowShiftNoSprites = 0;
    fetcherTilePal = 0;
    fetcherTileNoSprites = 0;
    fetcherTileAttrs = 0;
    fetcherBgWindowShiftFilled = 0;
    fetcherObjShiftUpper = 0;
    fetcherObjShiftLower = 0;
    fetcherObjShiftPal0 = 0;
    fetcherObjShiftPal1 = 0;
    fetcherObjShiftPal2 = 0;
    fetcherObjShiftBgPrio = 0;
    fetcherWindow = false;
    fetcherStall = 0;
    fetcherCycles = 0;
    fetcherTileY = 0;
    fetcherTileBank = 0;
    fetcherNoSprites = false;
    fetcherYFlip = false;
    fetcherXFlip = false;
    fetcherTiledataAddr = 0;

    newdmaLength = 0;
    hdmaRemaining = 0;
    hdmaSource = 0;
    hdmaDest = 0;
    hdmaComplete = false;
    hdmaPaused = false;
    gdmaComplete = false;

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
            this.scheduler.addEventRelative(SchedulerId.PPUMode, (4 - cyclesLate) << this.gb.doubleSpeed, this.enterMode2Late);
        }
        this.scheduler.addEventRelative(SchedulerId.PPUMode, (80 - cyclesLate) << this.gb.doubleSpeed, this.endMode2);

        if (this.wy == this.ly) {
            this.windowYTrigger = true;
        }
    };

    enterMode2Late = (cyclesLate: number) => {
        this.mode = PPUMode.OamScan;
        this.checkStat();
    };

    endMode2 = (cyclesLate: number) => { // OAM Scan -> Drawing
        if (this.objEnable) {
            this.fastInitialOamScan();
        }

        this.mode = PPUMode.Drawing;
        this.checkStat();
        let mode3Extra = 0;
        mode3Extra += this.scx & 0b111;
        mode3Extra += this.fastInitialOamScanSpriteCount * 6;
        if (this.wx > 7 && this.windowYTrigger && this.windowEnable) mode3Extra += 6;
        this.scheduler.addEventRelative(SchedulerId.PPUMode, (172 + mode3Extra - cyclesLate) << this.gb.doubleSpeed, this.endMode3);
        this.scheduler.addEventRelative(SchedulerId.PPUMode, (376 - cyclesLate) << this.gb.doubleSpeed, this.endMode0);
        this.mode3StartCycles = this.scheduler.currentTicks - cyclesLate;
    };

    endMode3 = (cyclesLate: number) => { // Drawing -> Hblank
        let mode3Length;
        if (this.fetcherCycles > 0) {
            // fetcherAdvance automatically returns when pixel rendering is done
            this.fetcherCatchup();
            mode3Length = this.fetcherCycles;
        } else {
            // If no writes by the predicted end of mode 3, use faster scanline render
            if (this.renderThisFrame) {
                this.renderScanline();
            }

            mode3Length = this.scheduler.currentTicks - this.mode3StartCycles - cyclesLate;
        }


        this.scanlineTimingsBack[this.ly] = mode3Length >> this.gb.doubleSpeed;

        this.mode = PPUMode.Hblank;
        this.checkStat();
        this.fetcherCycles = 0;

        if (this.hdmaRemaining > 0 && this.hdmaPaused === false) {
            this.newDma(1);
            this.hdmaRemaining--;
            // this.gb.cpuPausedTCyclesRemaining += 8;
        } else {
            this.hdmaRemaining = 0;
            this.hdmaComplete = true;
        }
    };

    endMode0 = (cyclesLate: number) => { // Hblank -> Vblank / OAM Scan
        this.ly++;
        this.checkStat();

        if (this.ly < 144) {
            this.enterMode2(cyclesLate); // Enter OAM Scan
        } else {
            this.enterMode1(cyclesLate); // Enter Vblank
        }
    };

    enterMode1 = (cyclesLate: number) => { // Enter Vblank
        this.scheduler.addEventRelative(SchedulerId.PPUMode, (4 - cyclesLate) << this.gb.doubleSpeed, this.enterMode1LateEffects);
        this.scheduler.addEventRelative(SchedulerId.PPUMode, (456 - cyclesLate) << this.gb.doubleSpeed, this.continueMode1);

        this.renderDoneScreen = true;
        this.renderDoneTimingDiagram = true;
        this.windowCurrentLine = -1;

        this.windowYTrigger = false;

        if (this.renderThisFrame) {
            this.swapBuffers();
        }

        this.currentFrame++;
        if (this.frameSkipRate > 0) {
            this.renderThisFrame = this.currentFrame % this.frameSkipRate == 0;
        } else {
            this.renderThisFrame = true;
        }
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
            this.scheduler.addEventRelative(SchedulerId.PPUMode, (4 - cyclesLate) << this.gb.doubleSpeed, this.line153Quirk);
            this.scheduler.addEventRelative(SchedulerId.PPUMode, (456 - cyclesLate) << this.gb.doubleSpeed, this.enterMode2);
        } else if (this.ly < 153) {
            this.scheduler.addEventRelative(SchedulerId.PPUMode, (456 - cyclesLate) << this.gb.doubleSpeed, this.continueMode1);
        }
    };

    line153Quirk = (cyclesLate: number) => {
        this.ly = 0;
        this.checkStat();
    };

    onEnable() {
        this.mode = PPUMode.GlitchedOamScan;
        this.scheduler.addEventRelative(SchedulerId.PPUMode, 74, this.endMode2);
        this.checkStat();
    }
    onDisable() {
        this.scheduler.cancelEventsById(SchedulerId.PPUMode);
        this.ly = 0;
        this.mode = PPUMode.Hblank;
        this.checkStat();
        this.renderThisFrame = false;
    }


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

    newDma(length: number) {
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < 16; j++) {
                this.gb.tick(2 << this.gb.doubleSpeed);
                this.write8(this.hdmaDest, this.gb.bus.read8(this.hdmaSource));

                this.hdmaSource++;
                this.hdmaSource &= 0xFFFF;
                this.hdmaDest++;
                this.hdmaDest &= 0xFFFF;
            }
        }
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

                    const maskFlip = 0b1 << x;
                    const lsbFlip = byte0 & maskFlip;
                    const msbFlip = byte1 & maskFlip;

                    // Update tile set
                    this.tileset[this.vramBank][tile][y][x] =
                        (lsb !== 0 ? 1 : 0) +
                        (msb !== 0 ? 2 : 0);

                    this.tilesetXFlipped[this.vramBank][tile][y][x] =
                        (lsbFlip !== 0 ? 1 : 0) +
                        (msbFlip !== 0 ? 2 : 0);
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
                // Write to CGB tile flags
                this.cgbAttrs[addr - 0x1800] = val;
            }
        }
        return;
    }

    readHwio8(addr: number): number {
        let val = 0;
        switch (addr) {
            case 0xFF40:
                return this.lcdcVal;
            case 0xFF41:
                if (this.enableLycIntr) val = bitSet(val, 6);
                if (this.enableMode2Intr) val = bitSet(val, 5);
                if (this.enableMode1Intr) val = bitSet(val, 4);
                if (this.enableMode0Intr) val = bitSet(val, 3);
                if (this.lyMatch) val = bitSet(val, 2);
                val |= this.mode & 0b11;
                val |= 0b10000000; // Bit 7 is always on 
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

            case 0xFF4F: // VRAM Bank
                return this.vramBank;

            case 0xFF55:
                if (this.gb.cgb) {
                    if (this.hdmaComplete || this.gdmaComplete) {
                        return 0xFF;
                    }
                    else {
                        return this.hdmaRemaining - 1;
                    }
                }
                break;

            case 0xFF68: // BCPS / BGPI - CGB Background Palette Index
                if (this.mode != PPUMode.Drawing) {
                    let bcpsVal = 0;
                    bcpsVal |= this.cgbBgPaletteIndex & 0x3F;
                    if (this.cgbBgPaletteIndexInc) bcpsVal = bitSet(bcpsVal, 7);
                    // console.log(`BG Pal Index Read: ${this.cgbObjPaletteIndex}`);
                    return bcpsVal;
                } else {
                    return 0xFF;
                }
            case 0xFF69: // BCPD / BGPD - CGB Background Palette Data
                // console.log(`BG Pal Data Read: ${this.cgbObjPaletteIndex}`);
                return this.bgPalette.data[this.cgbBgPaletteIndex];
            case 0xFF6A: // OCPS / OGPI - CGB Sprite Palette Index
                if (this.mode != PPUMode.Drawing) {
                    let ocpsVal = 0;
                    ocpsVal |= this.cgbObjPaletteIndex & 0x3F;
                    if (this.cgbObjPaletteIndexInc) ocpsVal = bitSet(ocpsVal, 7);
                    return ocpsVal;
                } else {
                    return 0xFF;
                }
            case 0xFF6B: // OCPD / OGPD - CGB Sprite Palette Data
                return this.objPalette.data[this.cgbObjPaletteIndex];

            default:
                console.log(`PPU: UNHANDLED HWIO READ: ${hex(addr, 4)}`);
                return 0xFF;
        }
        return val;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF40:
                if (this.lcdcVal != val) this.fetcherCatchup();
                this.lcdcVal = val;
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
                if (this.scy != val) this.fetcherCatchup();
                this.scy = val;
                return;
            case 0xFF43:
                if (this.scx != val) this.fetcherCatchup();
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
                if (this.dmgBgPalette != val) this.fetcherCatchup();
                this.dmgBgPalette = val;
                if (!this.gb.cgb) {
                    this.setDmgBgPalette(0, (val >> 0) & 0b11);
                    this.setDmgBgPalette(1, (val >> 2) & 0b11);
                    this.setDmgBgPalette(2, (val >> 4) & 0b11);
                    this.setDmgBgPalette(3, (val >> 6) & 0b11);
                }
                return;
            case 0xFF48: // OBJ 0 Palette 
                this.dmgObj0Palette = val;
                if (!this.gb.cgb) {
                    this.setDmgObjPalette(0, (val >> 0) & 0b11);
                    this.setDmgObjPalette(1, (val >> 2) & 0b11);
                    this.setDmgObjPalette(2, (val >> 4) & 0b11);
                    this.setDmgObjPalette(3, (val >> 6) & 0b11);
                }
                break;
            case 0xFF49: // OBJ 1 Palette 
                this.dmgObj1Palette = val;
                if (!this.gb.cgb) {
                    this.setDmgObjPalette(4, (val >> 0) & 0b11);
                    this.setDmgObjPalette(5, (val >> 2) & 0b11);
                    this.setDmgObjPalette(6, (val >> 4) & 0b11);
                    this.setDmgObjPalette(7, (val >> 6) & 0b11);
                }
                break;
            case 0xFF4A: // WY
                if (this.wy != val) this.fetcherCatchup();
                this.wy = val;
                return;
            case 0xFF4B: // WX
                if (this.wx != val) this.fetcherCatchup();
                this.wx = val;
                return;

            case 0xFF4F: // VRAM Bank
                if (this.gb.cgb) {
                    this.vramBank = val & 1;
                }
                return;

            case 0xFF51: // HDMA1 - Source Upper
                this.hdmaSource &= 0x00F0;
                this.hdmaSource |= (val << 8) & 0xFF00;
                return;
            case 0xFF52: // HDMA2 - Source Lower
                this.hdmaSource &= 0xFF00;
                this.hdmaSource |= (val << 0) & 0x00F0;
                return;
            case 0xFF53: // HDMA3 - Destination Upper
                this.hdmaDest &= 0x00F0;
                this.hdmaDest |= (val << 8) & 0xFF00;
                return;
            case 0xFF54: // HDMA4 - Destination Lower
                this.hdmaDest &= 0xFF00;
                this.hdmaDest |= (val << 0) & 0x00F0;
                return;
            case 0xFF55: // HDMA5
                if (this.gb.cgb) {
                    this.newdmaLength = (val & 127) + 1;
                    // Bit 7 - Use H-Blank DMA 
                    if (bitTest(val, 7)) {
                        // console.log(`Init HDMA ${this.newDmaLength} bytes: ${hex(this.newDmaSource, 4)} => ${hex(this.newDmaDest, 4)}`);
                        this.hdmaRemaining = this.newdmaLength;
                        this.hdmaComplete = false;
                        this.hdmaPaused = false;
                        this.gdmaComplete = false;
                    } else {
                        if (this.hdmaRemaining > 0) {
                            this.hdmaPaused = true;
                            this.gdmaComplete = false;
                            // console.log(`Paused HDMA ${this.hDmaRemaining} bytes remaining`);
                        } else {
                            // console.log(`GDMA ${this.newDmaLength} bytes: ${hex(this.newDmaSource, 4)} => ${hex(this.newDmaDest, 4)}`);
                            this.newDma(this.newdmaLength);
                            this.gdmaComplete = true;
                        }
                    }
                }
                return;

            case 0xFF68: // BCPS / BGPI - CGB Background Palette Index
                this.cgbBgPaletteIndex = val & 0x3F;
                this.cgbBgPaletteIndexInc = bitTest(val, 7);
                return;
            case 0xFF69: // BCPD / BGPD - CGB Background Palette Data
                // console.log(hex(val, 2));
                if (this.mode != PPUMode.Drawing) {
                    this.bgPalette.data[this.cgbBgPaletteIndex] = val;
                    this.bgPalette.update(this.cgbBgPaletteIndex >> 3, (this.cgbBgPaletteIndex >> 1) & 0b11);
                }
                if (this.cgbBgPaletteIndexInc) {
                    this.cgbBgPaletteIndex++;
                    this.cgbBgPaletteIndex &= 0x3F;
                }
                return;

            case 0xFF6A: // OCPS / OGPI - CGB Sprite Palette Index
                this.cgbObjPaletteIndex = val & 0x3F;
                this.cgbObjPaletteIndexInc = bitTest(val, 7);
                return;
            case 0xFF6B: // OCPD / OGPD - CGB Sprite Palette Data
                if (this.mode != PPUMode.Drawing) {
                    this.objPalette.data[this.cgbObjPaletteIndex] = val;
                    this.objPalette.update(this.cgbObjPaletteIndex >> 3, (this.cgbObjPaletteIndex >> 1) & 0b11);
                }
                if (this.cgbObjPaletteIndexInc) {
                    this.cgbObjPaletteIndex++;
                    this.cgbObjPaletteIndex &= 0x3F;
                }
                return;

            default:
                console.log(`PPU: UNHANDLED HWIO WRITE: ${hex(addr, 4)}`);
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
        let screenBase = this.ly * 160 * 3;
        let windowPixel = this.wx - 7;
        if (this.bgWindowEnable || this.gb.cgb) {
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

                    let attrs = this.cgbAttrs[tilemapAddr];

                    let tileBank = (attrs >> 3) & 1;
                    let noSprites = bitTest(attrs, 7);
                    let yFlip = bitTest(attrs, 6);
                    let xFlip = bitTest(attrs, 5);

                    let data = (xFlip ? this.tilesetXFlipped : this.tileset)[tileBank][tileIndex][yFlip ? tileY ^ 7 : tileY];
                    let palette = this.bgPalette.shades[attrs & 0b111];

                    // tp; tile pixel
                    if (t > 1) {
                        if (t < 20) {
                            for (let tp = 0; tp < 8; tp++) {
                                if (pixel >= 0) {
                                    this.screenBackBuf[screenBase++] = palette[data[tp]][0];
                                    this.screenBackBuf[screenBase++] = palette[data[tp]][1];
                                    this.screenBackBuf[screenBase++] = palette[data[tp]][2];
                                    this.scanlineRaw[pixel] = data[tp];
                                    this.scanlineNoSprites[pixel] = (noSprites && data[tp] != 0) ? 1 : 0;
                                }
                                pixel += 1;
                            }
                        } else {
                            for (let tp = 0; tp < 8; tp++) {
                                if (pixel >= 0) {
                                    this.screenBackBuf[screenBase++] = palette[data[tp]][0];
                                    this.screenBackBuf[screenBase++] = palette[data[tp]][1];
                                    this.screenBackBuf[screenBase++] = palette[data[tp]][2];
                                    this.scanlineRaw[pixel] = data[tp];
                                    this.scanlineNoSprites[pixel] = (noSprites && data[tp] != 0) ? 1 : 0;
                                }
                                pixel += 1;

                                if (pixel > 159) break bgLoop;
                            }
                        }
                    }
                    else {
                        for (let tp = 0; tp < 8; tp++) {
                            if (pixel >= 0) {
                                this.screenBackBuf[screenBase++] = palette[data[tp]][0];
                                this.screenBackBuf[screenBase++] = palette[data[tp]][1];
                                this.screenBackBuf[screenBase++] = palette[data[tp]][2];
                                this.scanlineRaw[pixel] = data[tp];
                                this.scanlineNoSprites[pixel] = (noSprites && data[tp] != 0) ? 1 : 0;
                            }
                            pixel += 1;

                            if (pixel > 159) break bgLoop;
                        }
                    }
                }
            }
            if (this.windowEnable && windowPixel < 160 && this.windowYTrigger) {
                this.windowCurrentLine++;

                let tilemapBase = (this.windowTilemapSelect ? 1024 : 0) + (((this.windowCurrentLine >> 3) << 5) & 1023);
                let lineOffset = 0;

                screenBase = (this.ly * 160 + windowPixel) * 3;
                let tileY = this.windowCurrentLine & 7;

                windowLoop:
                for (let t = 0; ; t++) {
                    let tilemapAddr = tilemapBase + ((lineOffset + t) & 31);
                    let tileIndex = this.tilemap[tilemapAddr];

                    if (!this.bgWindowTiledataSelect) {
                        // On high tileset, the tile number is signed with Two's complement
                        tileIndex = unTwo8b(tileIndex) + 256;
                    }

                    let attrs = this.cgbAttrs[tilemapAddr];

                    let tileBank = (attrs >> 3) & 1;
                    let noSprites = bitTest(attrs, 7);
                    let yFlip = bitTest(attrs, 6);
                    let xFlip = bitTest(attrs, 5);

                    let data = (xFlip ? this.tilesetXFlipped : this.tileset)[tileBank][tileIndex][yFlip ? tileY ^ 7 : tileY];
                    let palette = this.bgPalette.shades[attrs & 0b111];

                    // tp; tile pixel
                    for (let tp = 0; tp < 8; tp++) {
                        if (windowPixel >= 0) {
                            this.screenBackBuf[screenBase + 0] = palette[data[tp]][0];
                            this.screenBackBuf[screenBase + 1] = palette[data[tp]][1];
                            this.screenBackBuf[screenBase + 2] = palette[data[tp]][2];
                            this.scanlineRaw[windowPixel] = data[tp];
                            this.scanlineNoSprites[windowPixel] = (noSprites && data[tp] != 0) ? 1 : 0;
                        }
                        screenBase += 3;
                        windowPixel += 1;
                        if (windowPixel > 159) break windowLoop;
                    }
                }
            }
        } else {
            for (let p = 0; p < 160; p++) {
                this.screenBackBuf[screenBase++] = 0xFF;
                this.screenBackBuf[screenBase++] = 0xFF;
                this.screenBackBuf[screenBase++] = 0xFF;
                this.scanlineRaw[p] = 0;
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
                    screenBase = (this.ly * 160 + screenX) * 3;

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

                    let tileData = this.tileset[this.gb.cgb ? (cgbVramBank ? 1 : 0) : 0][tileIndex][tileY];

                    let paletteId = this.gb.cgb ? cgbPalette : (dmgPalette ? 1 : 0);
                    let palette = this.objPalette.shades[paletteId];

                    if (xFlip) {
                        for (let px = 7; px >= 0; px--) {
                            let prePalette = tileData[px];
                            if (screenX >= 0 && prePalette != 0) {
                                let cgbMasterPriority = this.gb.cgb && !this.bgWindowEnable;
                                if (((!bgPriority || this.scanlineRaw[screenX] == 0) && !this.scanlineNoSprites[screenX]) || cgbMasterPriority) {
                                    this.screenBackBuf[screenBase + 0] = palette[prePalette][0];
                                    this.screenBackBuf[screenBase + 1] = palette[prePalette][1];
                                    this.screenBackBuf[screenBase + 2] = palette[prePalette][2];
                                }
                            }
                            screenBase += 3;
                            screenX++;
                        }
                    } else {
                        for (let px = 0; px < 8; px++) {
                            let prePalette = tileData[px];
                            if (screenX >= 0 && prePalette != 0) {
                                let cgbMasterPriority = this.gb.cgb && !this.bgWindowEnable;
                                if (((!bgPriority || this.scanlineRaw[screenX] == 0) && !this.scanlineNoSprites[screenX]) || cgbMasterPriority) {
                                    this.screenBackBuf[screenBase + 0] = palette[prePalette][0];
                                    this.screenBackBuf[screenBase + 1] = palette[prePalette][1];
                                    this.screenBackBuf[screenBase + 2] = palette[prePalette][2];
                                }
                            }
                            screenBase += 3;
                            screenX++;
                        }
                    }
                }

                oamAddr += 4;
            }
        }
    }

    fetcherCatchup() {
        if (this.mode == PPUMode.Drawing) {
            if (this.fetcherCycles == 0) {
                this.fetcherReset();
                this.fetcherOamScan();

                // Special window trigger case
                if (this.windowEnable && this.windowYTrigger && this.wx < 8) {
                    this.windowCurrentLine++;

                    this.fetcherWindow = true;
                    this.fetcherX = this.wx - 7;
                }

                if (this.objEnable) {
                    while (this.fetcherSpriteNextX <= 0) {
                        let shiftOut = -(this.fetcherSpriteNextX);
                        this.fetcherSpriteFetch(shiftOut);
                    }
                }
            }

            let current = this.scheduler.currentTicks;
            let diff = current - this.mode3StartCycles;
            this.mode3StartCycles = current;

            this.fetcherAdvance(diff >> this.gb.doubleSpeed);
        }
    }


    fastInitialOamScan(): void {
        this.fastInitialOamScanSpriteCount = 0;

        let objHeight = this.objSize ? 16 : 8;

        for (let s = 0; s < 160; s += 4) {
            let yPos = this.oam[s];
            let xPos = this.oam[s + 1];
            let screenYStart = yPos - 16;
            let screenXStart = xPos - 8;

            if (this.ly >= screenYStart && this.ly < screenYStart + objHeight && screenXStart < 160) {
                this.fastInitialOamScanSpriteCount++;
                if (this.fastInitialOamScanSpriteCount >= 10) break;
            }
        }
    };

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
                let xFlip = bitTest(flags, 5);
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

                let lowerData = this.vram[data.cgbVramBank ? 1 : 0][tiledataAddr + 0];
                let upperData = this.vram[data.cgbVramBank ? 1 : 0][tiledataAddr + 1];

                if (xFlip) {
                    data.tileDataLower = lowerData;
                    data.tileDataUpper = upperData;
                } else {
                    data.tileDataLower = byteFlip(lowerData);
                    data.tileDataUpper = byteFlip(upperData);
                }
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
                                    this.fetcherTileAttrs = this.cgbAttrs[tilemapAddr];
                                } else {
                                    let tilemapBase = (this.windowTilemapSelect ? 1024 : 0) + (((this.windowCurrentLine >> 3) << 5) & 1023);
                                    let tilemapAddr = tilemapBase + (this.fetcherTile & 31);
                                    this.fetcherTile++;
                                    this.fetcherTileIndex = this.tilemap[tilemapAddr];
                                    this.fetcherTileAttrs = this.cgbAttrs[tilemapAddr];
                                }

                                if (!this.bgWindowTiledataSelect) {
                                    // On high tileset, the tile number is signed with two's complement
                                    this.fetcherTileIndex = unTwo8b(this.fetcherTileIndex) + 256;
                                }

                                if (!this.fetcherWindow) {
                                    this.fetcherTileY = (this.scy + this.ly) & 7;
                                } else {
                                    this.fetcherTileY = this.windowCurrentLine & 7;
                                }

                                this.fetcherTileBank = (this.fetcherTileAttrs >> 3) & 1;
                                this.fetcherNoSprites = bitTest(this.fetcherTileAttrs, 7);
                                this.fetcherYFlip = bitTest(this.fetcherTileAttrs, 6);
                                this.fetcherXFlip = bitTest(this.fetcherTileAttrs, 5);

                                let paletteId = this.fetcherTileAttrs & 0b111;

                                if (this.fetcherYFlip) this.fetcherTileY ^= 7;

                                this.fetcherTiledataAddr = (this.fetcherTileIndex * 16) + (this.fetcherTileY * 2);

                                this.fetcherTileNoSprites = this.fetcherNoSprites ? this.fetcherTileDataLower | this.fetcherTileDataUpper : 0;
                                this.fetcherTilePal = paletteId;

                                this.fetcherStep++;
                                break;
                            case 1:
                                this.fetcherStep++;
                                break;
                            case 2: // Fetch lower
                                let lower = this.vram[this.fetcherTileBank][this.fetcherTiledataAddr + 0];
                                if (!this.fetcherXFlip) {
                                    this.fetcherTileDataLower = byteFlip(lower);
                                } else {
                                    this.fetcherTileDataLower = lower;
                                }

                                this.fetcherStep++;
                                break;

                            case 3:
                                this.fetcherStep++;
                                break;
                            case 4: // Fetch upper
                                let upper = this.vram[this.fetcherTileBank][this.fetcherTiledataAddr + 1];
                                if (!this.fetcherXFlip) {
                                    this.fetcherTileDataUpper = byteFlip(upper);
                                } else {
                                    this.fetcherTileDataUpper = upper;
                                }
                                this.fetcherStep++;
                                break;
                            case 5:
                                this.fetcherPushReady = true;
                                this.fetcherStep = 0;
                                break;
                        }
                    } else {
                        if ((this.fetcherBgWindowShiftFilled & 0xFF) == 0) {
                            this.fetcherPushReady = false;
                            this.fetcherBgWindowShiftNoSprites = this.fetcherTileNoSprites;
                            this.fetcherBgWindowShiftPal = this.fetcherTilePal;
                            this.fetcherBgWindowShiftLower = this.fetcherTileDataLower;
                            this.fetcherBgWindowShiftUpper = this.fetcherTileDataUpper;
                            this.fetcherBgWindowShiftFilled = 0xFF;
                        }
                    }

                    if ((this.fetcherBgWindowShiftFilled & 0xFF) != 0) {
                        if (this.fetcherX >= 0) {
                            let bgWindowPixelUpper = this.fetcherBgWindowShiftUpper & 1;
                            let bgWindowPixelLower = this.fetcherBgWindowShiftLower & 1;
                            let bgWindowCol = (bgWindowPixelUpper << 1) | bgWindowPixelLower;

                            let screenBase = (this.ly * 160 + this.fetcherX) * 3;
                            if (this.bgWindowEnable || this.gb.cgb) {
                                this.screenBackBuf[screenBase + 0] = this.bgPalette.shades[this.fetcherBgWindowShiftPal][bgWindowCol][0];
                                this.screenBackBuf[screenBase + 1] = this.bgPalette.shades[this.fetcherBgWindowShiftPal][bgWindowCol][1];
                                this.screenBackBuf[screenBase + 2] = this.bgPalette.shades[this.fetcherBgWindowShiftPal][bgWindowCol][2];
                            } else {
                                this.screenBackBuf[screenBase + 0] = 0xFF;
                                this.screenBackBuf[screenBase + 1] = 0xFF;
                                this.screenBackBuf[screenBase + 2] = 0xFF;
                            }

                            let objPixelUpper = this.fetcherObjShiftUpper & 1;
                            let objPixelLower = this.fetcherObjShiftLower & 1;

                            let objPalette = (((this.fetcherObjShiftPal0 & 1) << 0) | ((this.fetcherObjShiftPal1 & 1) << 1) | ((this.fetcherObjShiftPal2 & 1) << 2)) & 0b111;

                            if (this.bgWindowEnable || !this.gb.cgb) {
                                objPixelUpper &= ((this.fetcherBgWindowShiftNoSprites) ^ 1) & 1;
                                objPixelLower &= ((this.fetcherBgWindowShiftNoSprites) ^ 1) & 1;
                            }

                            let objCol = (objPixelUpper << 1) | objPixelLower;

                            if (objCol != 0) {
                                let priority = this.fetcherObjShiftBgPrio & 1;
                                let palette = this.objPalette.shades[objPalette];
                                if (!priority || bgWindowCol == 0) {
                                    this.screenBackBuf[screenBase + 0] = palette[objCol][0];
                                    this.screenBackBuf[screenBase + 1] = palette[objCol][1];
                                    this.screenBackBuf[screenBase + 2] = palette[objCol][2];
                                }
                            }

                            this.fetcherObjShiftUpper >>= 1;
                            this.fetcherObjShiftLower >>= 1;
                            this.fetcherObjShiftPal0 >>= 1;
                            this.fetcherObjShiftPal1 >>= 1;
                            this.fetcherObjShiftPal2 >>= 1;
                            this.fetcherObjShiftBgPrio >>= 1;
                            this.fetcherBgWindowShiftNoSprites >>= 1;

                            if (this.fetcherX == this.wx - 8 && this.windowEnable && this.windowYTrigger) {
                                // Window trigger
                                this.windowCurrentLine++;

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
                this.fetcherCycles += 1;
            } else {
                return;
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
        this.fetcherObjShiftPal0 = 0;
        this.fetcherObjShiftPal1 = 0;
        this.fetcherObjShiftPal2 = 0;
        this.fetcherObjShiftBgPrio = 0;

        this.fetcherBgWindowShiftLower = 0;
        this.fetcherBgWindowShiftUpper = 0;
        this.fetcherBgWindowShiftFilled = 0;
    }

    fetcherSpriteFetch(shiftOut: number) {
        let spriteData = this.fetcherSpriteData[this.fetcherSprite];
        // Sprite trigger
        let pal = spriteData.dmgPalette;
        let cgbPal = spriteData.cgbPalette;
        let priority = spriteData.bgPriority;

        let dontDraw = this.fetcherObjShiftUpper | this.fetcherObjShiftLower;

        this.fetcherObjShiftUpper = ((this.fetcherObjShiftUpper & dontDraw) | (spriteData.tileDataUpper & ~dontDraw)) >> shiftOut;
        this.fetcherObjShiftLower = ((this.fetcherObjShiftLower & dontDraw) | (spriteData.tileDataLower & ~dontDraw)) >> shiftOut;
        this.fetcherObjShiftBgPrio = ((this.fetcherObjShiftBgPrio & dontDraw) | (priority ? 0xFF : 0) & ~dontDraw) >> shiftOut;

        if (this.gb.cgb) {
            this.fetcherObjShiftPal0 = ((this.fetcherObjShiftPal0 & dontDraw) | ((bitTest(cgbPal, 0) ? 0xFF : 0) & ~dontDraw)) >> shiftOut;
            this.fetcherObjShiftPal1 = ((this.fetcherObjShiftPal1 & dontDraw) | ((bitTest(cgbPal, 1) ? 0xFF : 0) & ~dontDraw)) >> shiftOut;
            this.fetcherObjShiftPal2 = ((this.fetcherObjShiftPal2 & dontDraw) | ((bitTest(cgbPal, 2) ? 0xFF : 0) & ~dontDraw)) >> shiftOut;
        } else {
            this.fetcherObjShiftPal0 = ((this.fetcherObjShiftPal0 & dontDraw) | ((pal ? 0xFF : 0) & ~dontDraw)) >> shiftOut;
        }

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

        if (this.gb.bus.oamDmaActive) {
            this.scheduler.cancelEventsById(SchedulerId.OAMDMA);
        }
        this.scheduler.addEventRelative(SchedulerId.OAMDMA, 4, this.oamDmaLock);
    }

    oamDmaLock = (cyclesLate: number) => {
        this.gb.bus.oamDmaActive = true;
        this.scheduler.addEventRelative(SchedulerId.OAMDMA, 160 - cyclesLate, this.oamDmaUnlock);
    };

    oamDmaUnlock = (cyclesLate: number) => {
        this.gb.bus.oamDmaActive = false;
    };
}