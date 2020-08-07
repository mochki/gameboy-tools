import { GameBoy } from "../core/gameboy";
import { GameBoyProvider } from "../core/provider";

export class GameBoyManager {
    gb: GameBoy;

    skipBootrom = true;

    constructor() {
        this.gb = new GameBoy(this.skipBootrom);

        setInterval(() => {
            if (this.gb.bus.mbc.sramDirty) {
                this.gb.bus.mbc.sramDirty = false;
                console.log("Flushing SRAM...");
                let title = this.gb.bus.getTitle();
                (window as any).localforage.setItem(`${title}.sav`, this.gb.bus.mbc.ram);
            }
        }, 1000);
    }

    romLoaded = false;

    async loadRom(rom: Uint8Array) {
        let oldBootrom = this.gb.provider?.bootrom;
        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(rom, oldBootrom));
        this.romLoaded = true;

        let title = this.gb.bus.getTitle();
        if (!(window as any).localforage) alert('localForage not found!');
        let sav = await (window as any).localforage.getItem(`${title}.sav`) as Uint8Array;
        if (!sav) {
            console.log(`Save not found for ${title}.`);
        } else {
            console.log(`Save found for ${title}, loading...`);
            this.gb.bus.mbc.ram.set(sav, 0);
        }
    }

    loadBootrom(bootrom: Uint8Array) {
        let oldRom = this.gb.provider?.rom ?? new Uint8Array(0);
        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(oldRom, bootrom));
    }
}
