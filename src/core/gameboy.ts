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
        this.dmgBootrom();
    }

    dmgBootrom() {
        this.cpu.pc = 0x100;
        this.bus.bootromEnabled = false;

        this.cpu.setAf(0x01B0);
        this.cpu.setBc(0x0013);
        this.cpu.setDe(0x00D8);
        this.cpu.setHl(0x014D);
        this.cpu.sp = 0xFFFE;

        this.bus.write8(0xFF05, 0x00);
        this.bus.write8(0xFF06, 0x00);
        this.bus.write8(0xFF07, 0x00);
        // Sound register writes
        // this.bus.write8(0xFF10, 0x80); 
        // this.bus.write8(0xFF11, 0xBF);
        // this.bus.write8(0xFF12, 0xF3);
        // this.bus.write8(0xFF14, 0xBF);
        // this.bus.write8(0xFF16, 0x3F);
        // this.bus.write8(0xFF17, 0x00);
        // this.bus.write8(0xFF19, 0xBF);
        // this.bus.write8(0xFF1A, 0x7F);
        // this.bus.write8(0xFF1B, 0xFF);
        // this.bus.write8(0xFF1C, 0x9F);
        // this.bus.write8(0xFF1E, 0xBF);
        // this.bus.write8(0xFF20, 0xFF);
        // this.bus.write8(0xFF21, 0x00);
        // this.bus.write8(0xFF22, 0x00);
        // this.bus.write8(0xFF23, 0xBF);
        // this.bus.write8(0xFF24, 0x77);
        // this.bus.write8(0xFF25, 0xF3);
        this.bus.write8(0xFF26, 0xF1);
        this.bus.write8(0xFF40, 0x91);
        this.bus.write8(0xFF42, 0x00);
        this.bus.write8(0xFF43, 0x00);
        this.bus.write8(0xFF45, 0x00);
        this.bus.write8(0xFF47, 0xFC);
        this.bus.write8(0xFF48, 0xFF);
        this.bus.write8(0xFF49, 0xFF);
        this.bus.write8(0xFF4A, 0x00);
        this.bus.write8(0xFF4B, 0x00);
        this.bus.write8(0xFFFF, 0x00);
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

    public frame(): number {
        let i = 0;
        let cpu = this.cpu;
        while (i < 70224) {
            i += cpu.execute();
        }
        return i;
    }

    public halfFrame(): number {
        let i = 0;
        let cpu = this.cpu;
        while (i < 35112) {
            i += cpu.execute();
        }
        return i;
    }


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
    }

    haltSkippedCycles = 0;
    haltSkip(): void {
        const terminateAt = 1000000;
        for (let i = 0; i < terminateAt; i++) {
            let ticksPassed = this.scheduler.nextEventTicks - this.scheduler.currTicks;
            this.scheduler.currTicks = this.scheduler.nextEventTicks;
            this.scheduler.popFirstEvent().callback(0);

            this.cpu.cycles += ticksPassed;
            this.haltSkippedCycles += ticksPassed;

            if ((this.interrupts.ie & this.interrupts.if & 0x1F) != 0) {
                return;
            }
        }
        alert(`Processed ${terminateAt} events and couldn't exit HALT! Assuming crashed.`);
        this.errored = true;
    }
}