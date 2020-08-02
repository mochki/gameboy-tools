import { Interrupts } from './interrupts';
import { Scheduler, SchedulerId } from './scheduler';
import { GameBoyProvider } from './provider';
import { Bus } from "./bus";
import { CPU } from "./cpu/cpu";
import { PPU } from './ppu';
import { Joypad } from './joypad';
import { Timer } from './timer';
import { APU } from './apu';

export class GameBoy {
    bus: Bus;
    ppu: PPU;
    cpu: CPU;
    interrupts: Interrupts;
    joypad: Joypad;
    timer: Timer;
    apu: APU;
    
    provider: GameBoyProvider | null = null;

    scheduler: Scheduler;

    constructor(provider?: GameBoyProvider) {
        this.scheduler = new Scheduler();
        this.interrupts = new Interrupts();
        this.joypad = new Joypad();
        this.ppu = new PPU(this, this.scheduler);
        this.apu = new APU(this, this.scheduler);
        this.timer = new Timer(this, this.scheduler);
        this.bus = new Bus(this, this.ppu, this.interrupts, this.joypad, this.timer, this.apu);
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
        this.bus.updateMapper();
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
    // info(text: string) {
    //     return;
    //     this.infoText.unshift(text);
    //     this.infoText = this.infoText.slice(0, 10);
    // }
    resetInfo() {
        this.infoText = [];
    }

    sampleTimer = 0;
    sampleMax = 4194304/262144;
    public tick(ticks: number): void {
        this.scheduler.currTicks += ticks;
        while (
            this.scheduler.currTicks >= this.scheduler.nextEventTicks &&
            this.scheduler.heapSize > 0
        ) {
            let current = this.scheduler.currTicks;
            let next = this.scheduler.nextEventTicks;
            this.scheduler.popFirstEvent().callback(current - next);
        }

        this.sampleTimer += ticks;
        if (this.sampleTimer >= this.sampleMax) {
            this.sampleTimer -= this.sampleMax
            this.apu.sample();
        }
    }
}