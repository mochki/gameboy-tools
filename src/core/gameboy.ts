import { GameBoyProvider } from './provider';
import { Bus } from "./bus";
import { CPU } from "./cpu/cpu";

export class GameBoy {
    bus: Bus;
    cpu: CPU;

    provider: GameBoyProvider | null = null;

    errored = false;
    infoText = "";
    error(text: string) {
        this.errored = true;
        this.infoText += text;
        this.infoText += '\n';
    }
    info(text: string) {
        this.infoText += text;
        this.infoText += '\n';
    }
    resetInfo() {
        this.infoText = "";
    }

    constructor(provider?: GameBoyProvider) {
        this.bus = new Bus(this);
        this.cpu = new CPU(this);

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

    public step(): void {
        this.cpu.execute();
    }
}