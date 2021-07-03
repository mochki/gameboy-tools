import { bitTest, bitSet, BIT_6, BIT_7 } from "./util/bits";
import { GameBoy } from "./gameboy";
import { SchedulerId, Scheduler } from "./scheduler";
import { AudioPlayer, SAMPLE_RATE } from "./audioplayer";
import { GetTextLineHeightWithSpacing } from "../lib/imgui-js/imgui";
import { hex } from "./util/misc";
import { WavDownloader } from "./util/wavdownloader";
import { PPUMode } from "./ppu";
import { FastRNG } from "../frontend/FastRNG";
import { LanzcosResampler } from "./resampler";

// Starts from NR10 / 0xFF10
const regMask = Uint8Array.from([
    0x80, 0x3F, 0x00, 0xFF, 0xBF,
    0xFF, 0x3F, 0x00, 0xFF, 0xBF,
    0x7F, 0xFF, 0x9F, 0xFF, 0xBF,
    0xFF, 0xFF, 0x00, 0x00, 0xBF,
    0x00, 0x00, 0x70
]);


export const pulseDuty = [
    Uint8Array.from([1, 1, 1, 1, 1, 1, 0, 1]),
    Uint8Array.from([1, 1, 1, 1, 1, 1, 0, 0]),
    Uint8Array.from([1, 1, 1, 1, 0, 0, 0, 0]),
    Uint8Array.from([1, 1, 0, 0, 0, 0, 0, 0]),
];

// Table of positions that when advancing, will change the value.
export const pulseAdvanceChangedVal = [
    Uint8Array.from([1, 0, 0, 0, 0, 0, 0, 1]),
    Uint8Array.from([0, 1, 0, 0, 0, 0, 0, 1]),
    Uint8Array.from([0, 1, 0, 0, 0, 1, 0, 0]),
    Uint8Array.from([0, 1, 0, 0, 0, 0, 0, 1]),
];

export const pulseDutyArray = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
];

const sampleBufMax = 512 * (SAMPLE_RATE / 65536);

export function dac(inVal: number) {
    return inVal / (15 / 2) - 1;
}

export const noiseDivisors = Uint8Array.from([8, 16, 32, 48, 64, 80, 96, 112]);
export const waveShiftCodes = Uint8Array.from([4, 0, 1, 2]);

// Maximum safe sample rate to push out for the browser
// 262144 | Chrome
// 131072 | Firefox
// 65536  | Safari
const channelSampleRate = SAMPLE_RATE / 1;
const cyclesPerSample = 4194304 / channelSampleRate;
let channelCyclesPerSample = 4194304 / channelSampleRate;
const outputSampleRate = SAMPLE_RATE;

export function setPitchScaler(scaler: number) {
    channelCyclesPerSample = scaler * cyclesPerSample;
}

const dmgChargeFactorBase = 0.999958;
const cgbChargeFactorBase = 0.998943;
const powerlatedThinksBestChargeFactorBase = 0.999777;
const capacitorChargeFactor = Math.pow(powerlatedThinksBestChargeFactorBase, 4194304 / outputSampleRate);

export const noise7Array: Uint8Array = genNoiseArray(true);
export const noise15Array: Uint8Array = genNoiseArray(false);

function genNoiseArray(sevenBit: boolean): Uint8Array {
    let array = new Uint8Array(65536);
    let lfsr = 0x7FFF;
    for (let i = 0; i < 65536; i++) {
        let xored = ((lfsr) ^ (lfsr >> 1)) & 1;
        lfsr >>= 1;
        lfsr |= (xored << 14);
        if (sevenBit) {
            lfsr &= ~(1 << 7);
            lfsr |= (xored << 6);
        }
        array[i] = ~lfsr & 1;
    }
    return array;
}

type Channel = {
    id: number;

    outL: number;
    outR: number;

    currentVal: number;
    lastVal: number;

    volume: number;
    volMulL: number;
    volMulR: number;
    enableL: boolean;
    enableR: boolean;

    enabled: boolean;
    dacEnabled: boolean;
};

export class APU {

    gb: GameBoy;
    scheduler: Scheduler;

    constructor(gb: GameBoy, scheduler: Scheduler) {
        this.gb = gb;
        this.scheduler = scheduler;

        this.resamplerL = new LanzcosResampler(32, 4194304, 48000, 5);
        this.resamplerR = new LanzcosResampler(32, 4194304, 48000, 5);
    }

    debugEnables = new Array(4).fill(true);

    resamplerL: LanzcosResampler;
    resamplerR: LanzcosResampler;

    lastUpdatedCh1 = 0;
    lastUpdatedCh2 = 0;
    lastUpdatedCh3 = 0;
    lastUpdatedCh4 = 0;

    frameSequencerStep = 0;
    advanceFrameSequencer = (cyclesLate: number) => {
        switch (this.frameSequencerStep) {
            case 0:
            case 4:
                this.clockLength();
                break;
            case 2:
            case 6:
                this.clockLength();
                this.clockSweep();
                break;
            case 7:
                this.clockEnvelope();
                break;
        }
        this.frameSequencerStep++;
        this.frameSequencerStep &= 7;

        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, (8192 - cyclesLate) << this.gb.doubleSpeed, this.advanceFrameSequencer);

        this.fastForwardCh1();
        this.fastForwardCh2();
        this.fastForwardCh3();
        this.fastForwardCh4();

        this.resamplerL.setValue(4, 0, 0);
        this.resamplerR.setValue(4, 0, 0);

        let samples = 0;
        // Keep reading samples as long as we have some
        while (this.resamplerL.currentSampleOutPos + 256 < this.resamplerL.currentSampleInPos) {
            let finalL = this.resamplerL.readOutSample();
            let finalR = this.resamplerR.readOutSample();

            let outL = finalL - this.capacitorL;
            let outR = finalR - this.capacitorR;

            this.capacitorL = finalL - outL * capacitorChargeFactor;
            this.capacitorR = finalR - outR * capacitorChargeFactor;

            this.sampleBufL[this.sampleBufPos] = outL;
            this.sampleBufR[this.sampleBufPos] = outR;
            this.sampleBufPos++;
            samples++;

            if (this.sampleBufPos >= sampleBufMax) {
                this.sampleBufPos = 0;
                if (!this.gb.turboMode) {
                    // console.log(sampleBufMax);
                    this.player.queueAudio(this.sampleBufL, this.sampleBufR);
                } else if (this.player.sourcesPlaying < 24) {
                    this.player.queueAudio(this.sampleBufL, this.sampleBufR);
                }
            }
        }
        // if (samples != 0) console.log(samples)
    };

    addChange(ch: Channel, time: number) {
        if (this.gb.doubleSpeed)
            time /= 2;

        // TODO: I'm too tired to deal with this crap
        let temp = ch.id != 2 ? ch.currentVal * ch.volume : ch.currentVal >> (ch as any).volumeShift;
        if (!ch.enabled) temp = 0;
        if (ch.dacEnabled) {
            if (ch.enableL) { ch.outL = (((temp / 15) * 2) - 1) * ch.volMulL; } else { ch.outL = 0; };
            if (ch.enableR) { ch.outR = (((temp / 15) * 2) - 1) * ch.volMulR; } else { ch.outR = 0; };
        } else {
            ch.outL = 0;
            ch.outR = 0;
        }

        if (this.debugEnables[ch.id]) {
            this.resamplerL.setValue(ch.id, time * (SAMPLE_RATE / 4194304), ch.outL / 4);
            this.resamplerR.setValue(ch.id, time * (SAMPLE_RATE / 4194304), ch.outR / 4);
        } else {
            this.resamplerL.setValue(ch.id, time * (SAMPLE_RATE / 4194304), 0);
            this.resamplerR.setValue(ch.id, time * (SAMPLE_RATE / 4194304), 0);
        }
    }

    sampleBufL = new Float32Array(sampleBufMax);
    sampleBufR = new Float32Array(sampleBufMax);
    sampleBufPos = 0;

    clockLength() {
        if (this.ch1.useLength) {
            if (this.ch1.lengthCounter <= 0) {
                this.ch1.enabled = false;
                this.fastForwardCh1();
                // console.log("ch1 disabled");
            } else {
                this.ch1.lengthCounter--;
            }
        }
        if (this.ch2.useLength) {
            if (this.ch2.lengthCounter <= 0) {
                this.ch2.enabled = false;
                this.fastForwardCh2();
            } else {
                this.ch2.lengthCounter--;
            }
        }
        if (this.ch3.useLength) {
            if (this.ch3.lengthCounter <= 0) {
                this.ch3.enabled = false;
                this.fastForwardCh3();
            } else {
                this.ch3.lengthCounter--;
            }
        }
        if (this.ch4.useLength) {
            if (this.ch4.lengthCounter <= 0) {
                this.ch4.enabled = false;
                this.fastForwardCh4();
            } else {
                this.ch4.lengthCounter--;
            }
        }
    }
    clockSweep() {
        if (this.ch1.sweepPeriod != 0 && this.ch1.sweepEnable) {
            if (this.ch1.sweepTimer <= 0) {
                this.ch1.sweepTimer = this.ch1.sweepPeriod;

                let diff = this.ch1.sweepShadowFrequency >> this.ch1.sweepShift;
                if (this.ch1.sweepIncrease) diff *= -1;
                this.ch1.sweepShadowFrequency += diff;

                if (this.ch1.sweepShadowFrequency > 2047) {
                    this.ch1.enabled = false;
                } else {
                    this.ch1.frequency = this.ch1.sweepShadowFrequency;
                    this.ch1.frequencyPeriod = (2048 - this.ch1.frequency) * 4;
                    this.ch1.frequencyHz = 131072 / (2048 - this.ch1.frequency);
                }
            }
            this.ch1.sweepTimer--;
        }
    }
    clockEnvelope() {
        if (this.ch1.envelopeTimer <= 0) {
            this.ch1.envelopeTimer = this.ch1.envelopePeriod;
            if (this.ch1.envelopePeriod != 0) {
                let volume = this.ch1.volume;
                if (this.ch1.envelopeIncrease) {
                    volume++;
                } else {
                    volume--;
                }

                if (volume >= 0 && volume <= 15) {
                    this.ch1.volume = volume;
                    this.fastForwardCh1();
                }
            }
        }
        this.ch1.envelopeTimer--;

        if (this.ch2.envelopeTimer <= 0) {
            this.ch2.envelopeTimer = this.ch2.envelopePeriod;
            if (this.ch2.envelopePeriod != 0) {
                let volume = this.ch2.volume;
                if (this.ch2.envelopeIncrease) {
                    volume++;
                } else {
                    volume--;
                }

                if (volume >= 0 && volume <= 15) {
                    this.ch2.volume = volume;
                    this.fastForwardCh2();
                }
            }
        }
        this.ch2.envelopeTimer--;

        if (this.ch4.envelopeTimer <= 0) {
            this.ch4.envelopeTimer = this.ch4.envelopePeriod;
            if (this.ch4.envelopePeriod != 0) {
                let volume = this.ch4.volume;
                if (this.ch4.envelopeIncrease) {
                    volume++;
                } else {
                    volume--;
                }

                if (volume >= 0 && volume <= 15) {
                    this.ch4.volume = volume;
                    this.fastForwardCh4();
                }
            }
        }
        this.ch4.envelopeTimer--;
    }

    ch1 = {
        id: 0,

        // Internal state
        enabled: false,
        dacEnabled: false,

        pos: 0,
        currentVal: 0,
        lastVal: 0,
        outL: 0,
        outR: 0,
        lastOutL: 0,
        lastOutR: 0,

        frequencyTimer: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,

        sweepEnable: false,
        sweepTimer: 0,
        sweepShadowFrequency: 0,

        enableL: false,
        enableR: false,

        volMulL: 0,
        volMulR: 0,
        // -------

        // NR10
        sweepPeriod: 0,
        sweepIncrease: false,
        sweepShift: 0,

        // NR11
        duty: 2,
        // length: 0,

        // NR12
        envelopeInitial: 0,
        envelopeIncrease: false,
        envelopePeriod: 0,

        // NR13
        // NR14
        frequency: 0,
        useLength: false,

        frequencyPeriod: 256,
        frequencyHz: 0,
    };

    ch2 = {
        id: 1,

        // Internal state
        enabled: false,
        dacEnabled: false,

        pos: 0,
        currentVal: 0,
        lastVal: 0,
        outL: 0,
        outR: 0,
        lastOutL: 0,
        lastOutR: 0,

        frequencyTimer: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,

        enableL: false,
        enableR: false,

        volMulL: 0,
        volMulR: 0,
        // -------

        // NR21
        duty: 2,
        // length: 0,

        // NR22
        envelopeInitial: 0,
        envelopeIncrease: false,
        envelopePeriod: 0,

        // NR23
        // NR24
        frequency: 0,
        useLength: false,

        frequencyPeriod: 256,
        frequencyHz: 0,
    };

    ch3 = {
        id: 2,

        // Internal state
        enabled: false,
        dacEnabled: false,

        pos: 0,
        posSampler: 0,
        currentVal: 0,
        lastVal: 0,
        outL: 0,
        outR: 0,
        lastOutL: 0,
        lastOutR: 0,

        frequencyTimer: 0,
        frequencyTimerSampler: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,

        waveTable: new Uint8Array(32),

        volumeShift: 0,

        enableL: false,
        enableR: false,

        volMulL: 0,
        volMulR: 0,
        // -------

        lastUpdateTicks: 0,

        // NR31
        // length: 0,

        // NR32
        volumeCode: 0,

        // NR33
        // NR34
        frequency: 0,
        useLength: false,

        frequencyPeriod: 256,
    };

    ch4 = {
        id: 3,

        // Internal state
        enabled: false,
        dacEnabled: false,

        currentVal: 0,
        lastVal: 0,
        outL: 0,
        outR: 0,
        lastOutL: 0,
        lastOutR: 0,

        frequencyTimer: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,

        lfsr: 0,

        enableL: false,
        enableR: false,

        volMulL: 0,
        volMulR: 0,
        // -------

        // NR41
        duty: 2,
        // length: 0,

        // NR42
        envelopeInitial: 0,
        envelopeIncrease: false,
        envelopePeriod: 0,

        // NR43
        frequencyShift: 0,
        sevenBit: 0,
        divisorCode: 0,

        // NR44
        useLength: false,
        frequencyPeriod: 256,
    };

    enabled = false;

    emulateInterference = false;

    registers = new Uint8Array(23);

    enableL1 = false;
    enableL2 = false;
    enableL3 = false;
    enableL4 = false;

    enableR1 = false;
    enableR2 = false;
    enableR3 = false;
    enableR4 = false;

    volMulL = 0;
    volMulR = 0;

    triggerCh1() {
        this.lastUpdatedCh1 = this.scheduler.currentTicks;
        this.ch1.frequencyTimer = this.ch1.frequencyPeriod;

        if (this.ch1.dacEnabled) this.ch1.enabled = true;
        this.ch1.volume = this.ch1.envelopeInitial;
        if (this.ch1.lengthCounter == 0) this.ch1.lengthCounter = 64;

        this.ch1.sweepShadowFrequency = this.ch1.frequency;
        this.ch1.sweepTimer = this.ch1.sweepPeriod;

        this.ch1.sweepEnable = this.ch1.sweepPeriod + this.ch1.sweepShift != 0;
    }

    triggerCh2() {
        this.lastUpdatedCh2 = this.scheduler.currentTicks;
        this.ch2.frequencyTimer = this.ch2.frequencyPeriod;

        if (this.ch2.dacEnabled) this.ch2.enabled = true;
        this.ch2.volume = this.ch2.envelopeInitial;
        if (this.ch2.lengthCounter == 0) this.ch2.lengthCounter = 64;
    }

    triggerCh3() {
        this.lastUpdatedCh3 = this.scheduler.currentTicks;
        this.ch3.frequencyTimer = this.ch3.frequencyPeriod;

        this.ch3.pos = 0;
        this.ch3.posSampler = 0;
        this.ch3.lastUpdateTicks = this.gb.scheduler.currentTicks;
        this.ch3.frequencyTimerSampler = this.ch3.frequencyPeriod;
        if (this.ch3.dacEnabled) this.ch3.enabled = true;
        if (this.ch3.lengthCounter == 0) this.ch3.lengthCounter = 256;
    }

    triggerCh4() {
        this.lastUpdatedCh4 = this.scheduler.currentTicks;

        this.ch4.frequencyTimer = this.ch3.frequencyPeriod;
        this.ch4.lfsr = 0x7FFF;
        if (this.ch4.dacEnabled) this.ch4.enabled = true;
        this.ch4.volume = this.ch4.envelopeInitial;
        if (this.ch4.lengthCounter == 0) this.ch4.lengthCounter = 64;
    }

    player = new AudioPlayer(sampleBufMax, outputSampleRate);

    capacitorL = 0;
    capacitorR = 0;

    catchupCh3(cyclesLate: number) {
        let diff = this.gb.scheduler.currentTicks - this.ch3.lastUpdateTicks - cyclesLate;
        this.ch3.lastUpdateTicks = this.gb.scheduler.currentTicks - cyclesLate;
        this.ch3.frequencyTimer -= diff;
        if (this.ch3.frequencyPeriod != 0) {
            while (this.ch3.frequencyTimer <= 0) {
                this.ch3.frequencyTimer += this.ch3.frequencyPeriod;
                this.ch3.pos = (this.ch3.pos + 1) & 31;
                this.ch3.currentVal = this.ch3.waveTable[this.ch3.pos];
            }
        }
    }

    fastForwardCh1() {
        let time = this.lastUpdatedCh1;
        this.ch1.frequencyTimer -= this.scheduler.currentTicks - this.lastUpdatedCh1;
        if (this.ch1.frequencyPeriod != 0) {
            while (this.ch1.frequencyTimer <= 0) {
                this.ch1.frequencyTimer += this.ch1.frequencyPeriod;
                time += this.ch1.frequencyPeriod << this.gb.doubleSpeed;

                this.ch1.pos = (this.ch1.pos + 1) & 7;
                this.ch1.currentVal = pulseDuty[this.ch1.duty][this.ch1.pos];

                this.addChange(this.ch1, time);
            }
        }
        this.lastUpdatedCh1 = time;
        this.addChange(this.ch1, time);
    }

    fastForwardCh2() {
        let time = this.lastUpdatedCh2;
        this.ch2.frequencyTimer -= this.scheduler.currentTicks - this.lastUpdatedCh2;
        if (this.ch2.frequencyPeriod != 0) {
            while (this.ch2.frequencyTimer <= 0) {
                this.ch2.frequencyTimer += this.ch2.frequencyPeriod;
                time += this.ch2.frequencyPeriod << this.gb.doubleSpeed;

                this.ch2.pos = (this.ch2.pos + 1) & 7;
                this.ch2.currentVal = pulseDuty[this.ch2.duty][this.ch2.pos];

                this.addChange(this.ch2, time);
            }
        }
        this.lastUpdatedCh2 = time;
        this.addChange(this.ch2, time);
    }

    fastForwardCh3() {
        let time = this.lastUpdatedCh3;
        this.ch3.frequencyTimerSampler -= this.scheduler.currentTicks - this.lastUpdatedCh3;
        if (this.ch3.frequencyPeriod != 0) {
            while (this.ch3.frequencyTimerSampler <= 0) {
                this.ch3.frequencyTimerSampler += this.ch3.frequencyPeriod;
                time += this.ch3.frequencyPeriod << this.gb.doubleSpeed;

                this.ch3.posSampler = (this.ch3.posSampler + 1) & 31;
                this.ch3.currentVal = this.ch3.waveTable[this.ch3.posSampler];

                this.addChange(this.ch3, time);
            }
        }
        this.lastUpdatedCh3 = time;
        this.addChange(this.ch3, time);
    }

    fastForwardCh4() {
        let time = this.lastUpdatedCh4;
        this.ch4.frequencyTimer -= this.scheduler.currentTicks - this.lastUpdatedCh4;
        if (this.ch4.frequencyPeriod != 0) {
            while (this.ch4.frequencyTimer <= 0) {
                this.ch4.frequencyTimer += this.ch4.frequencyPeriod;
                time += this.ch4.frequencyPeriod << this.gb.doubleSpeed;

                let lfsr = this.ch4.lfsr;
                let xored = ((lfsr) ^ (lfsr >> 1)) & 1;
                lfsr >>= 1;
                lfsr |= (xored << 14);
                lfsr &= ~this.ch4.sevenBit;
                lfsr |= ((xored << 6) & (this.ch4.sevenBit >> 1));
                this.ch4.lfsr = lfsr;

                this.ch4.currentVal = xored ^ 1;

                this.addChange(this.ch4, time);
            }
        }
        this.lastUpdatedCh4 = time;
        this.addChange(this.ch4, time);
    }

    sampleInterference(): number {
        let val = 0;
        if (this.gb.ppu.lcdDisplayEnable && this.gb.ppu.mode == PPUMode.Drawing) {
            if (this.gb.ppu.ly < 144) {
                val += 0.1;
            } else {
                val += 0.5;
            }
        }
        if (this.gb.halted) {
            val -= 0.5;
        }

        val += this.rng.next() % 0.5;

        return val;
    }

    rng = new FastRNG();

    downloader = new WavDownloader(outputSampleRate);

    readHwio8(addr: number): number {
        switch (addr) {
            case 0xFF10: case 0xFF11: case 0xFF12: case 0xFF13: case 0xFF14: // NR1X
            case 0xFF15: case 0xFF16: case 0xFF17: case 0xFF18: case 0xFF19: // NR2X
            case 0xFF1A: case 0xFF1B: case 0xFF1C: case 0xFF1D: case 0xFF1E: // NR3X
            case 0xFF1F: case 0xFF20: case 0xFF21: case 0xFF22: case 0xFF23: // NR4X
            case 0xFF24: case 0xFF25: // NR5X
                {
                    let index = addr - 0xFF10;
                    let regVal = this.registers[index];
                    let mask = regMask[index];
                    return regVal | mask;
                }

            case 0xFF26: // NR52
                {
                    let val = 0;
                    if (this.ch1.enabled) val = bitSet(val, 0);
                    if (this.ch2.enabled) val = bitSet(val, 1);
                    if (this.ch3.enabled) val = bitSet(val, 2);
                    if (this.ch4.enabled) val = bitSet(val, 3);
                    if (this.enabled) val = bitSet(val, 7);
                    let rwBits = this.registers[0xFF26 - 0xFF10] & 0b01110000;
                    // console.log("NR52 read: " + hex((val & 0b10001111) | rwBits | regMask[0xFF26 - 0xFF10], 2));
                    return (val & 0b10001111) | rwBits | regMask[0xFF26 - 0xFF10];
                }

            case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37: // Wave Table
            case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F: // Wave Table
                {
                    let index;
                    if (this.ch3.enabled) {
                        this.catchupCh3(0);
                        index = this.ch3.pos & 0b11111110;
                    } else {
                        index = (addr - 0xFF30) * 2;
                    }
                    let upper = (this.ch3.waveTable[index + 0] << 4) & 0xF0;
                    let lower = (this.ch3.waveTable[index + 1] << 0) & 0x0F;
                    return upper | lower;
                }
        }
        return 0xFF;
    }
    writeHwio8(addr: number, val: number): void {
        if (this.enabled) {
            if (addr >= 0xFF10 && addr <= 0xFF26) {
                let index = addr - 0xFF10;
                this.registers[index] = val;
            }

            switch (addr) {
                case 0xFF10: // NR10
                    this.ch1.sweepShift = (val >> 0) & 0b111;
                    this.ch1.sweepIncrease = bitTest(val, 3);
                    this.ch1.sweepPeriod = (val >> 4) & 0b111;
                    this.fastForwardCh1();
                    break;
                case 0xFF11: // NR11
                    this.ch1.lengthCounter = 64 - ((val >> 0) & 0b111111);
                    this.ch1.duty = (val >> 6) & 0b11;
                    this.fastForwardCh1();
                    break;
                case 0xFF12: // NR12
                    {
                        const oldEnvelopeIncrease = this.ch1.envelopeIncrease;

                        this.ch1.dacEnabled = (val & 0b11111000) != 0;
                        if (!this.ch1.dacEnabled) this.ch1.enabled = false;
                        this.ch1.envelopePeriod = (val >> 0) & 0b111;
                        this.ch1.envelopeIncrease = bitTest(val, 3);
                        this.ch1.envelopeInitial = (val >> 4) & 0b1111;

                        if (this.ch1.enabled) {
                            if (this.ch1.envelopePeriod == 0) {
                                if (this.ch1.envelopeIncrease) {
                                    this.ch1.volume += 1;
                                    this.ch1.volume &= 0xF;
                                } else {
                                    this.ch1.volume += 2;
                                    this.ch1.volume &= 0xF;
                                }
                            }
                            if (this.ch1.envelopeIncrease != oldEnvelopeIncrease) {
                                this.ch1.volume = 0;
                            }
                        }

                        this.fastForwardCh1();
                    }
                    break;
                case 0xFF13: // NR13
                    this.ch1.frequency &= 0b11100000000;
                    this.ch1.frequency |= ((val & 0xFF) << 0);

                    this.ch1.frequencyPeriod = (2048 - this.ch1.frequency) * 4;
                    this.ch1.frequencyHz = 131072 / (2048 - this.ch1.frequency);
                    this.fastForwardCh1();
                    break;
                case 0xFF14: // NR14
                    this.ch1.frequency &= 0b00011111111;
                    this.ch1.frequency |= ((val & 0b111) << 8);
                    this.ch1.useLength = bitTest(val, 6);

                    this.ch1.frequencyPeriod = (2048 - this.ch1.frequency) * 4;
                    this.ch1.frequencyHz = 131072 / (2048 - this.ch1.frequency);

                    if (bitTest(val, 7)) this.triggerCh1();
                    this.fastForwardCh1();
                    break;

                case 0xFF16: // NR21
                    this.ch2.lengthCounter = 64 - ((val >> 0) & 0b111111);
                    this.ch2.duty = (val >> 6) & 0b11;
                    this.fastForwardCh2();
                    break;
                case 0xFF17: // NR22 
                    {
                        const oldEnvelopeIncrease = this.ch2.envelopeIncrease;

                        this.ch2.dacEnabled = (val & 0b11111000) != 0;
                        if (!this.ch2.dacEnabled) this.ch2.enabled = false;
                        this.ch2.envelopePeriod = (val >> 0) & 0b111;
                        this.ch2.envelopeIncrease = bitTest(val, 3);
                        this.ch2.envelopeInitial = (val >> 4) & 0b1111;

                        if (this.ch2.enabled) {
                            if (this.ch2.envelopePeriod == 0) {
                                if (this.ch2.envelopeIncrease) {
                                    this.ch2.volume += 1;
                                    this.ch2.volume &= 0xF;
                                } else {
                                    this.ch2.volume += 2;
                                    this.ch2.volume &= 0xF;
                                }
                            }
                            if (this.ch2.envelopeIncrease != oldEnvelopeIncrease) {
                                this.ch2.volume = 0;
                            }
                        }

                        this.fastForwardCh2();
                    }
                    break;
                case 0xFF18: // NR23
                    this.ch2.frequency &= 0b11100000000;
                    this.ch2.frequency |= ((val & 0xFF) << 0);

                    this.ch2.frequencyPeriod = (2048 - this.ch2.frequency) * 4;
                    this.ch2.frequencyHz = 131072 / (2048 - this.ch2.frequency);
                    this.fastForwardCh2();
                    break;
                case 0xFF19: // NR24
                    this.ch2.frequency &= 0b00011111111;
                    this.ch2.frequency |= ((val & 0b111) << 8);
                    this.ch2.useLength = bitTest(val, 6);

                    this.ch2.frequencyPeriod = (2048 - this.ch2.frequency) * 4;
                    this.ch2.frequencyHz = 131072 / (2048 - this.ch2.frequency);

                    if (bitTest(val, 7)) this.triggerCh2();
                    this.fastForwardCh2();
                    break;

                case 0xFF1A: // NR30
                    this.ch3.dacEnabled = bitTest(val, 7);
                    if (!this.ch3.dacEnabled) this.ch3.enabled = false;
                    this.fastForwardCh3();
                    break;
                case 0xFF1B: // NR31
                    this.ch3.lengthCounter = 256 - ((val >> 0) & 0xFF);
                    this.fastForwardCh3();
                    break;
                case 0xFF1C: // NR32
                    this.ch3.volumeCode = (val >> 5) & 0b11;
                    this.ch3.volumeShift = waveShiftCodes[this.ch3.volumeCode];
                    this.fastForwardCh3();
                    break;
                case 0xFF1D: // NR33
                    this.ch3.frequency &= 0b11100000000;
                    this.ch3.frequency |= ((val & 0xFF) << 0);

                    this.ch3.frequencyPeriod = (2048 - this.ch3.frequency) * 2;
                    this.fastForwardCh3();
                    break;
                case 0xFF1E: // NR34
                    this.ch3.frequency &= 0b00011111111;
                    this.ch3.frequency |= ((val & 0b111) << 8);
                    this.ch3.useLength = bitTest(val, 6);

                    this.ch3.frequencyPeriod = (2048 - this.ch3.frequency) * 2;

                    // Trigger after frequency period is written, so frequency timer is reloaded with correct value!
                    if (bitTest(val, 7)) this.triggerCh3();
                    this.fastForwardCh3();
                    break;

                case 0xFF20: // NR41
                    this.ch4.lengthCounter = 64 - ((val >> 0) & 0b111111);
                    this.fastForwardCh4();
                    break;
                case 0xFF21: // NR42
                    {
                        let oldEnvelopeIncrease = this.ch4.envelopeIncrease;

                        this.ch4.dacEnabled = (val & 0b11111000) != 0;
                        if (!this.ch4.dacEnabled) this.ch4.enabled = false;
                        this.ch4.envelopePeriod = (val >> 0) & 0b111;
                        this.ch4.envelopeIncrease = bitTest(val, 3);
                        this.ch4.envelopeInitial = (val >> 4) & 0b1111;

                        if (this.ch4.enabled) {
                            if (this.ch4.envelopePeriod == 0) {
                                if (this.ch4.envelopeIncrease) {
                                    this.ch4.volume += 1;
                                    this.ch4.volume &= 0xF;
                                } else {
                                    this.ch4.volume += 2;
                                    this.ch4.volume &= 0xF;
                                }
                            }
                            if (this.ch4.envelopeIncrease != oldEnvelopeIncrease) {
                                this.ch4.volume = 0;
                            }
                        }

                        this.fastForwardCh4();
                    }
                    break;
                case 0xFF22: // NR43
                    this.ch4.frequencyShift = (val >> 4) & 0b1111;
                    this.ch4.sevenBit = bitTest(val, 3) ? (1 << 7) : 0;
                    this.ch4.divisorCode = (val >> 0) & 0b111;

                    this.ch4.frequencyPeriod = noiseDivisors[this.ch4.divisorCode] << this.ch4.frequencyShift;
                    this.fastForwardCh4();
                    break;
                case 0xFF23: // NR44
                    this.ch4.useLength = bitTest(val, 6);
                    if (bitTest(val, 7)) this.triggerCh4();
                    this.fastForwardCh4();
                    break;

                case 0xFF24: // NR50
                    let volMulL = ((val >> 4) & 0b111) / 7;
                    let volMulR = ((val >> 0) & 0b111) / 7;
                    this.ch1.volMulL = volMulL;
                    this.ch1.volMulR = volMulR;
                    this.ch2.volMulL = volMulL;
                    this.ch2.volMulR = volMulR;
                    this.ch3.volMulL = volMulL;
                    this.ch3.volMulR = volMulR;
                    this.ch4.volMulL = volMulL;
                    this.ch4.volMulR = volMulR;

                    this.fastForwardCh1();
                    this.fastForwardCh2();
                    this.fastForwardCh3();
                    this.fastForwardCh4();
                    break;
                case 0xFF25: // NR51
                    this.ch4.enableL = bitTest(val, 7);
                    this.ch3.enableL = bitTest(val, 6);
                    this.ch2.enableL = bitTest(val, 5);
                    this.ch1.enableL = bitTest(val, 4);
                    this.ch4.enableR = bitTest(val, 3);
                    this.ch3.enableR = bitTest(val, 2);
                    this.ch2.enableR = bitTest(val, 1);
                    this.ch1.enableR = bitTest(val, 0);
                    this.fastForwardCh1();
                    this.fastForwardCh2();
                    this.fastForwardCh3();
                    this.fastForwardCh4();
                    break;
            }
        }

        switch (addr) {
            case 0xFF26: // NR52
                if (!bitTest(val, 7)) {
                    for (let i = 0xFF10; i < 0xFF26; i++) {
                        // console.log(i);
                        this.writeHwio8(i, 0);
                    }

                    this.ch1.pos = 0;
                    this.ch2.pos = 0;
                    this.ch3.pos = 0;
                    this.ch3.posSampler = 0;

                    this.ch1.frequencyPeriod = 0;
                    this.ch2.frequencyPeriod = 0;
                    this.ch3.frequencyPeriod = 0;
                    this.ch4.frequencyPeriod = 0;

                    this.ch1.frequencyTimer = 0;
                    this.ch2.frequencyTimer = 0;
                    this.ch3.frequencyTimer = 0;
                    this.ch3.frequencyTimerSampler = 0;
                    this.ch4.frequencyTimer = 0;

                    // Upon turning on the APU, the frame sequencer requires an extra trigger to begin functioning.
                    this.frameSequencerStep = 255;
                }
                this.enabled = bitTest(val, 7);
                break;

            case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37: // Wave Table
            case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F: // Wave Table
                let index;
                if (this.ch3.enabled) {
                    // let diff = this.gb.scheduler.currTicks - this.ch3.lastUpdateTicks;
                    // console.log(`before pos: ${this.ch3.pos}`);
                    // console.log(`before timer: ${this.ch3.frequencyTimer}`);
                    this.catchupCh3(0);
                    // console.log(`after pos: ${this.ch3.pos}`);
                    index = this.ch3.pos & 0b11111110;
                    // console.log(`write at: ${hex(0xFF30 + (index >> 2), 4)} idx: ${index} pos: ${this.ch3.pos}`);
                    // console.log(`freq period: ${this.ch3.frequencyPeriod}`);
                    // console.log(`diff: ${diff}`);
                } else {
                    index = (addr - 0xFF30) * 2;
                }
                this.ch3.waveTable[index + 0] = (val >> 4) & 0xF;
                this.ch3.waveTable[index + 1] = (val >> 0) & 0xF;
                break;
        }
    };
}