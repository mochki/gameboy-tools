import { GameBoy } from "../core/gameboy";
import { GameBoyProvider } from "../core/provider";

export class GameBoyManager {
    gb: GameBoy;

    skipBootrom = true;

    constructor() {
        this.gb = new GameBoy(this.skipBootrom);
    }

    romLoaded = false;

    loadRom(rom: Uint8Array) {
        let oldBootrom = this.gb.provider?.bootrom;
        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(rom, oldBootrom));
        this.romLoaded = true;
    }

    loadBootrom(bootrom: Uint8Array) {
        let oldRom = this.gb.provider?.rom ?? new Uint8Array(0);
        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(oldRom, bootrom));
    }
}