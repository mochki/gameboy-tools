import { GameBoy } from "../core/gameboy";
import { GameBoyProvider } from "../core/provider";

export class GameBoyManager {
    gb: GameBoy;
    
    constructor() {
        this.gb = new GameBoy();
    }

    romLoaded = false;

    loadRom(rom: Uint8Array) {
        let oldBootrom = this.gb.provider?.bootrom;
        this.gb = new GameBoy(new GameBoyProvider(rom, oldBootrom));
        this.romLoaded = true;
    }

    loadBootrom(bootrom: Uint8Array) {
        let oldRom = this.gb.provider?.rom ?? new Uint8Array(0);
        this.gb = new GameBoy(new GameBoyProvider(oldRom, bootrom));
    }
}