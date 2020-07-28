import { Interrupts } from './interrupts';
import { Scheduler } from './scheduler';
import { GameBoyProvider } from './provider';
import { Bus } from "./bus";
import { CPU } from "./cpu/cpu";
import { PPU } from './ppu';

export class GameBoy {
    bus: Bus;
    ppu: PPU;
    cpu: CPU;
    interrupts: Interrupts;

    provider: GameBoyProvider | null = null;

    scheduler: Scheduler;

    constructor(provider?: GameBoyProvider) {
        this.ppu = new PPU(this);
        this.interrupts = new Interrupts();
        this.bus = new Bus(this, this.ppu, this.interrupts);
        this.cpu = new CPU(this, this.bus, this.interrupts);

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

        this.scheduler = new Scheduler();

        this.cpu.pc = 0x100;
        this.bus.bootromEnabled = false;
    }

    cgb = false;

    errored = false;
    infoText: string[] = [];
    error(text: string) {
        this.errored = true;
        this.infoText.unshift("ERROR:");
        this.infoText.unshift(text);
        this.infoText = this.infoText.slice(0, 10);
    }
    info(text: string) {
        return;
        this.infoText.unshift(text);
        this.infoText = this.infoText.slice(0, 10);
    }
    resetInfo() {
        this.infoText = [];
    }

    public step(): void {
        this.cpu.execute();
    }

    public tick(ticks: number): void {
        this.scheduler.currTicks += ticks;
        while (
            this.scheduler.currTicks >= this.scheduler.currEventTicks &&
            this.scheduler.heapSize > 0
        ) {
            let evt = this.scheduler.popFirstEvent();
            evt.callback();
        }
    }
}