import { GameBoyProvider } from './provider';
import { Bus } from "./bus";
import { CPU } from "./cpu/cpu";
import { PPU } from './ppu';

export class GameBoy {
    bus: Bus;
    ppu: PPU;
    cpu: CPU;

    provider: GameBoyProvider | null = null;

    constructor(provider?: GameBoyProvider) {
        this.cpu = new CPU(this);
        this.ppu = new PPU(this);
        this.bus = new Bus(this, this.ppu);

        if (provider) {
            for (let i = 0; i < provider.rom.length; i++) {
                if (i < this.bus.rom.length) {
                    this.bus.rom[i] = provider.rom[i];
                }
            }
            for (let i = 0; i < provider.bootrom.length; i++) {
                if (i < this.bus.bootrom.length) {
                    this.bus.bootrom[i] = provider.bootrom[i];
                }
            }
            this.provider = provider;
        }
    }

    errored = false;
    infoText: string[] = [];
    error(text: string) {
        this.errored = true;
        this.infoText.unshift("ERROR:");
        this.infoText.unshift(text);
        this.infoText = this.infoText.slice(0, 100);
    }
    info(text: string) {
        this.infoText.unshift(text);
        this.infoText = this.infoText.slice(0, 100);
    }
    resetInfo() {
        this.infoText = [];
    }


    public step(): void {
        this.cpu.execute();
    }
}