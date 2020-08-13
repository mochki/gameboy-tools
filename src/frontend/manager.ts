import { GameBoy } from "../core/gameboy";
import { GameBoyProvider } from "../core/provider";
import { Bus } from "../core/bus";

export class GameBoyManager {
    gb: GameBoy;

    skipBootrom = true;
    volume = 1;

    constructor() {
        this.gb = new GameBoy(this.skipBootrom);

        setInterval(() => {
            if (this.gb.bus.mbc.sramDirty) {
                this.gb.bus.mbc.sramDirty = false;
                this.flushSram();
            }
        }, 1000);
    }

    setVolume(volume: number) {
        this.volume = volume;
        this.gb.apu.player.gain.gain.value = this.volume;
    }

    updateVolume() {
        this.gb.apu.player.gain.gain.value = this.volume;
    }

    flushSram() {
        console.log("Flushing SRAM...");
        let title = Bus.getTitle(this.gb.bus.rom);
        (window as any).localforage.setItem(`${title}.sav`, this.gb.bus.mbc.ram);
    }

    romLoaded = false;

    reset() {
        let sram = new Uint8Array(this.gb.bus.mbc.ram.length);
        sram.set(this.gb.bus.mbc.ram);
        let provider = this.gb.provider;
        this.gb = new GameBoy(this.skipBootrom, provider);
        this.gb.bus.mbc.ram.set(sram);
        this.updateVolume();
    }

    loadSave(save: Uint8Array) {
        this.gb.bus.mbc.ram.set(save);
    }

    async loadRom(rom: Uint8Array) {
        this.romLoaded = true;

        if (!(window as any).localforage) alert('localForage not found!');

        let title = Bus.getTitle(rom);
        let sav = await (window as any).localforage.getItem(`${title}.sav`) as Uint8Array;

        let oldBootrom = this.gb.provider?.bootrom;
        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(rom, oldBootrom));
        if (!sav) {
            console.log(`Save not found for ${title}.`);
        } else {
            console.log(`Save found for ${title}, loading...`);
            this.gb.bus.mbc.ram.set(sav);
        }
        this.updateVolume();
    }

    loadBootrom(bootrom: Uint8Array) {
        let oldRom = this.gb.provider?.rom ?? new Uint8Array(0);
        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(oldRom, bootrom));
        this.updateVolume();
    }
}
