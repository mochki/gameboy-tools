import { bitTest, bitSet, BIT_6, BIT_7 } from "./util/bits";
import { GameBoy } from "./gameboy";
import { SchedulerId, Scheduler } from "./scheduler";
import { AudioPlayer, SAMPLE_RATE } from "./audioplayer";
import { GetTextLineHeightWithSpacing, NextColumn } from "../lib/imgui-js/imgui";
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

const sampleBufMax = Math.floor(512 * (SAMPLE_RATE / 65536));

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

const evenMoreBassChargeFactorBase = 0.99999;
const dmgChargeFactorBase = 0.999958;
const cgbChargeFactorBase = 0.998943;
const powerlatedThinksBestChargeFactorBase = 0.999777;
const capacitorChargeFactor = Math.pow(dmgChargeFactorBase, 4194304 / outputSampleRate);

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

abstract class Channel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }

    currentVal: number = 0;
    lastVal = 0;

    lengthCounter = 0;
    frequencyTimer = 0;
    frequencyPeriod = 256;
    frequency = 0;

    volume = 0;
    enableL = false;
    enableR = false;

    enabled = false;
    dacEnabled = false;

    useLength = false;

    time = 0;

    // NR{1,2,4}2
    envelopeInitial = 0;
    envelopeIncrease = false;
    envelopePeriod = 0;
    envelopeTimer = 0;

    clockLength() {
        if (this.useLength) {
            if (this.lengthCounter <= 0) {
                this.enabled = false;
            } else {
                this.lengthCounter--;
            }
        }
    }

    clockEnvelope() {
        if (this.envelopeTimer <= 0) {
            this.envelopeTimer = this.envelopePeriod;
            if (this.envelopePeriod != 0) {
                let volume = this.volume;
                if (this.envelopeIncrease) {
                    volume++;
                } else {
                    volume--;
                }

                if (volume >= 0 && volume <= 15) {
                    this.volume = volume;
                }
            }
        }
        this.envelopeTimer--;
    }

    abstract next(): void;
};

class PulseChannel extends Channel {
    pos = 0;

    sweepEnable = false;
    sweepTimer = 0;
    sweepShadowFrequency = 0;

    // -------

    // NR10
    sweepPeriod = 0;
    sweepIncrease = false;
    sweepShift = 0;

    // NR{1,2}1
    duty = 2;
    // length: 0,

    // NR{1,2}3
    // NR{1,2}4
    frequencyHz = 0;

    next() {
        this.pos = (this.pos + 1) & 7;
        this.currentVal = pulseDuty[this.duty][this.pos];
    }

    clockSweep() {
        if (this.sweepPeriod != 0 && this.sweepEnable) {
            if (this.sweepTimer <= 0) {
                this.sweepTimer = this.sweepPeriod;

                let diff = this.sweepShadowFrequency >> this.sweepShift;
                if (this.sweepIncrease) diff *= -1;
                this.sweepShadowFrequency += diff;

                if (this.sweepShadowFrequency > 2047) {
                    this.enabled = false;
                } else {
                    this.frequency = this.sweepShadowFrequency;
                    this.frequencyPeriod = (2048 - this.frequency) * 4;
                    this.frequencyHz = 131072 / (2048 - this.frequency);
                }
            }
            this.sweepTimer--;
        }
    }
}

class WaveChannel extends Channel {
    pos = 0;
    posSampler = 0;
    currentVal = 0;

    frequencyTimerAccess = 0;

    envelopeTimer = 0;

    waveTable = new Uint8Array(32);

    volumeShift = 0;

    // -------

    lastUpdateTicks = 0;

    // NR31
    // length: 0,

    // NR32
    volumeCode = 0;

    next() {
        this.posSampler = (this.posSampler + 1) & 31;
        this.currentVal = this.waveTable[this.posSampler];
    }
}

class NoiseChannel extends Channel {
    currentVal = 0;
    lastVal = 0;

    envelopeTimer = 0;

    lfsr = 0;
    // -------

    // NR43
    frequencyShift = 0;
    sevenBit = 0;
    divisorCode = 0;

    next() {
        let lfsr = this.lfsr;
        let xored = ((lfsr) ^ (lfsr >> 1)) & 1;
        lfsr >>= 1;
        lfsr |= (xored << 14);
        lfsr &= ~this.sevenBit;
        lfsr |= ((xored << 6) & (this.sevenBit >> 1));
        this.lfsr = lfsr;
        this.currentVal = xored ^ 1;
    }
}


export class APU {
    gb: GameBoy;
    scheduler: Scheduler;

    constructor(gb: GameBoy, scheduler: Scheduler) {
        this.gb = gb;
        this.scheduler = scheduler;

        this.resamplerL = new LanzcosResampler(16, true, 4);
        this.resamplerR = new LanzcosResampler(16, true, 4);
        this.downloader = new WavDownloader(outputSampleRate, "");
    }

    setResamplerEnabled(enabled: boolean) {
        this.resamplerL.setKernelSize(16, true, enabled);
        this.resamplerR.setKernelSize(16, true, enabled);
    }

    setNightcoreMode(enabled: boolean) {
        this.nightcoreModeShift = enabled ? 1 : 0;
    }
    nightcoreModeShift = 0;

    debugEnables = new Array(4).fill(true);

    resamplerL: LanzcosResampler;
    resamplerR: LanzcosResampler;
    sampleTimer = 0;
    lastSampleTime = 0;

    record = false;

    frameSequencerTimer = (cyclesLate: number) => {
        this.advanceFrameSequencer();
        this.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, (8192 - cyclesLate) << this.gb.doubleSpeed, this.frameSequencerTimer);

        this.fastForward(this.ch1, cyclesLate >> this.gb.doubleSpeed);
        this.fastForward(this.ch2, cyclesLate >> this.gb.doubleSpeed);
        this.fastForward(this.ch3, cyclesLate >> this.gb.doubleSpeed);
        this.fastForward(this.ch4, cyclesLate >> this.gb.doubleSpeed);

        let correctedTime = this.gb.constantRateTicks + (cyclesLate >> this.gb.doubleSpeed);

        this.sampleTimer += SAMPLE_RATE * (correctedTime - this.lastSampleTime);
        while (this.sampleTimer >= 4194304) {
            this.sampleTimer -= 4194304;

            let outL = this.resamplerL.readOutSample();
            let outR = this.resamplerR.readOutSample();

            let finalL = outL - this.capacitorL;
            let finalR = outR - this.capacitorR;

            this.capacitorL = outL - finalL * capacitorChargeFactor;
            this.capacitorR = outR - finalR * capacitorChargeFactor;

            this.sampleBufL[this.sampleBufPos] = finalL;
            this.sampleBufR[this.sampleBufPos] = finalR;
            this.sampleBufPos++;

            if (this.sampleBufPos >= sampleBufMax) {
                if (this.record) {
                    this.downloader.addSamples(this.sampleBufL, this.sampleBufR, sampleBufMax);
                }

                this.sampleBufPos = 0;
                if (!this.gb.turboMode) {
                    // console.log(sampleBufMax);
                    this.player.queueAudio(this.sampleBufL, this.sampleBufR);
                } else if (this.player.sourcesPlaying < 12) {
                    this.player.queueAudio(this.sampleBufL, this.sampleBufR);
                }
            }
        }

        this.lastSampleTime = correctedTime;
    };

    download() {
        this.downloader.download();
    }

    frameSequencerStep = 0;
    advanceFrameSequencer() {
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
    }

    addChange(ch: Channel, time: number) {
        let temp = ch.id != 2 ? ch.currentVal * ch.volume : ch.currentVal >> (ch as WaveChannel).volumeShift;

        let outL = 0;
        let outR = 0;

        if (!ch.enabled) temp = 0;
        if (ch.dacEnabled) {
            if (ch.enableL) outL = (((temp / 15) * 2) - 1) * this.volMulL;
            if (ch.enableR) outR = (((temp / 15) * 2) - 1) * this.volMulR;
        }

        if (this.debugEnables[ch.id]) {
            this.resamplerL.setValue(ch.id, time * (SAMPLE_RATE / 4194304), outL / 4, 1);
            this.resamplerR.setValue(ch.id, time * (SAMPLE_RATE / 4194304), outR / 4, 1);
        } else {
            this.resamplerL.setValue(ch.id, time * (SAMPLE_RATE / 4194304), 0, 1);
            this.resamplerR.setValue(ch.id, time * (SAMPLE_RATE / 4194304), 0, 1);
        }
    }

    sampleBufL = new Float32Array(sampleBufMax);
    sampleBufR = new Float32Array(sampleBufMax);
    sampleBufPos = 0;

    clockLength() {
        this.ch1.clockLength();
        this.ch2.clockLength();
        this.ch3.clockLength();
        this.ch4.clockLength();
    }
    clockSweep() {
        this.ch1.clockSweep();
    }
    clockEnvelope() {
        this.ch1.clockEnvelope();
        this.ch2.clockEnvelope();
        this.ch4.clockEnvelope();
    }

    ch1 = new PulseChannel(0);
    ch2 = new PulseChannel(1);
    ch3 = new WaveChannel(2);
    ch4 = new NoiseChannel(3);

    enabled = false;

    emulateInterference = false;

    registers = new Uint8Array(23);

    volMulL = 0;
    volMulR = 0;

    triggerCh1() {
        this.ch1.time = this.gb.constantRateTicks;
        this.ch1.frequencyTimer = this.ch1.frequencyPeriod;

        if (this.ch1.dacEnabled) this.ch1.enabled = true;
        this.ch1.volume = this.ch1.envelopeInitial;
        if (this.ch1.lengthCounter == 0) this.ch1.lengthCounter = 64;

        this.ch1.sweepShadowFrequency = this.ch1.frequency;
        this.ch1.sweepTimer = this.ch1.sweepPeriod;

        this.ch1.sweepEnable = this.ch1.sweepPeriod + this.ch1.sweepShift != 0;
    }

    triggerCh2() {
        this.ch2.time = this.gb.constantRateTicks;
        this.ch2.frequencyTimer = this.ch2.frequencyPeriod;

        if (this.ch2.dacEnabled) this.ch2.enabled = true;
        this.ch2.volume = this.ch2.envelopeInitial;
        if (this.ch2.lengthCounter == 0) this.ch2.lengthCounter = 64;
    }

    triggerCh3() {
        this.ch3.time = this.gb.constantRateTicks;
        this.ch3.frequencyTimer = this.ch3.frequencyPeriod;

        this.ch3.pos = 0;
        this.ch3.posSampler = 0;
        this.ch3.lastUpdateTicks = this.gb.constantRateTicks;
        this.ch3.frequencyTimerAccess = this.ch3.frequencyPeriod;
        if (this.ch3.dacEnabled) this.ch3.enabled = true;
        if (this.ch3.lengthCounter == 0) this.ch3.lengthCounter = 256;
    }

    triggerCh4() {
        this.ch4.time = this.gb.constantRateTicks;
        this.ch4.frequencyTimer = this.ch4.frequencyPeriod;
        this.ch4.lfsr = 0x7FFF;
        if (this.ch4.dacEnabled) this.ch4.enabled = true;
        this.ch4.volume = this.ch4.envelopeInitial;
        if (this.ch4.lengthCounter == 0) this.ch4.lengthCounter = 64;
    }

    player = new AudioPlayer(sampleBufMax, outputSampleRate);

    capacitorL = 0;
    capacitorR = 0;

    catchupCh3(cyclesLate: number) {
        let diff = this.gb.constantRateTicks - this.ch3.lastUpdateTicks - cyclesLate;
        this.ch3.lastUpdateTicks = this.gb.constantRateTicks - cyclesLate;
        this.ch3.frequencyTimerAccess -= diff;
        if (this.ch3.frequencyPeriod != 0) {
            while (this.ch3.frequencyTimerAccess <= 0) {
                this.ch3.frequencyTimerAccess += this.ch3.frequencyPeriod;
                this.ch3.pos = (this.ch3.pos + 1) & 31;
                this.ch3.currentVal = this.ch3.waveTable[this.ch3.pos];
            }
        }
    }

    // For some reason it took me an entire week to figure out how implement proper fast forwarding
    // BUT I FINALLY DID IT :D 
    fastForward(ch: Channel, cyclesLate: number) {
        let correctedTime = this.gb.constantRateTicks - cyclesLate;
        if (ch.frequencyPeriod != 0) {
            let time = ch.time + ch.frequencyTimer;
            ch.frequencyTimer -= correctedTime + cyclesLate - ch.time;
            let period = ch.frequencyPeriod >> this.nightcoreModeShift;
            while (ch.frequencyTimer <= 0) {
                ch.frequencyTimer += period;
                time += period;
                ch.next();
                this.addChange(ch, time);
            }
        }
        ch.time = correctedTime;
    }

    ffCh1() { this.fastForward(this.ch1, 0); }
    ffCh2() { this.fastForward(this.ch2, 0); }
    ffCh3() { this.fastForward(this.ch3, 0); }
    ffCh4() { this.fastForward(this.ch4, 0); }

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

    downloader: WavDownloader;

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
                    this.ffCh1();

                    this.ch1.sweepShift = (val >> 0) & 0b111;
                    this.ch1.sweepIncrease = bitTest(val, 3);
                    this.ch1.sweepPeriod = (val >> 4) & 0b111;
                    break;
                case 0xFF11: // NR11
                    this.ffCh1();

                    this.ch1.lengthCounter = 64 - ((val >> 0) & 0b111111);
                    this.ch1.duty = (val >> 6) & 0b11;
                    break;
                case 0xFF12: // NR12
                    {
                        this.ffCh1();

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
                    }
                    break;
                case 0xFF13: // NR13
                    this.ffCh1();

                    this.ch1.frequency &= 0b11100000000;
                    this.ch1.frequency |= ((val & 0xFF) << 0);

                    this.ch1.frequencyPeriod = (2048 - this.ch1.frequency) * 4;
                    this.ch1.frequencyHz = 131072 / (2048 - this.ch1.frequency);
                    break;
                case 0xFF14: // NR14
                    this.ffCh1();

                    this.ch1.frequency &= 0b00011111111;
                    this.ch1.frequency |= ((val & 0b111) << 8);
                    this.ch1.useLength = bitTest(val, 6);

                    this.ch1.frequencyPeriod = (2048 - this.ch1.frequency) * 4;
                    this.ch1.frequencyHz = 131072 / (2048 - this.ch1.frequency);

                    if (bitTest(val, 7)) this.triggerCh1();
                    break;

                case 0xFF16: // NR21
                    this.ffCh2();

                    this.ch2.lengthCounter = 64 - ((val >> 0) & 0b111111);
                    this.ch2.duty = (val >> 6) & 0b11;
                    break;
                case 0xFF17: // NR22 
                    {
                        this.ffCh2();

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
                    }
                    break;
                case 0xFF18: // NR23
                    this.ffCh2();

                    this.ch2.frequency &= 0b11100000000;
                    this.ch2.frequency |= ((val & 0xFF) << 0);

                    this.ch2.frequencyPeriod = (2048 - this.ch2.frequency) * 4;
                    this.ch2.frequencyHz = 131072 / (2048 - this.ch2.frequency);
                    break;
                case 0xFF19: // NR24
                    this.ffCh2();

                    this.ch2.frequency &= 0b00011111111;
                    this.ch2.frequency |= ((val & 0b111) << 8);
                    this.ch2.useLength = bitTest(val, 6);

                    this.ch2.frequencyPeriod = (2048 - this.ch2.frequency) * 4;
                    this.ch2.frequencyHz = 131072 / (2048 - this.ch2.frequency);

                    if (bitTest(val, 7)) this.triggerCh2();
                    break;

                case 0xFF1A: // NR30
                    this.ffCh3();

                    this.ch3.dacEnabled = bitTest(val, 7);
                    if (!this.ch3.dacEnabled) this.ch3.enabled = false;
                    break;
                case 0xFF1B: // NR31
                    this.ffCh3();

                    this.ch3.lengthCounter = 256 - ((val >> 0) & 0xFF);
                    break;
                case 0xFF1C: // NR32
                    this.ffCh3();

                    this.ch3.volumeCode = (val >> 5) & 0b11;
                    this.ch3.volumeShift = waveShiftCodes[this.ch3.volumeCode];
                    break;
                case 0xFF1D: // NR33
                    this.ch3.frequency &= 0b11100000000;
                    this.ch3.frequency |= ((val & 0xFF) << 0);

                    this.ch3.frequencyPeriod = (2048 - this.ch3.frequency) * 2;
                    this.ffCh3();
                    break;
                case 0xFF1E: // NR34
                    this.ffCh3();

                    this.ch3.frequency &= 0b00011111111;
                    this.ch3.frequency |= ((val & 0b111) << 8);
                    this.ch3.useLength = bitTest(val, 6);

                    this.ch3.frequencyPeriod = (2048 - this.ch3.frequency) * 2;

                    // Trigger after frequency period is written, so frequency timer is reloaded with correct value!
                    if (bitTest(val, 7)) this.triggerCh3();
                    break;

                case 0xFF20: // NR41
                    this.ffCh4();

                    this.ch4.lengthCounter = 64 - ((val >> 0) & 0b111111);
                    break;
                case 0xFF21: // NR42
                    {
                        this.ffCh4();

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
                    }
                    break;
                case 0xFF22: // NR43
                    this.ffCh4();

                    this.ch4.frequencyShift = (val >> 4) & 0b1111;
                    this.ch4.sevenBit = bitTest(val, 3) ? (1 << 7) : 0;
                    this.ch4.divisorCode = (val >> 0) & 0b111;

                    this.ch4.frequencyPeriod = noiseDivisors[this.ch4.divisorCode] << this.ch4.frequencyShift;
                    break;
                case 0xFF23: // NR44
                    this.ffCh4();

                    this.ch4.useLength = bitTest(val, 6);
                    if (bitTest(val, 7)) this.triggerCh4();
                    break;

                case 0xFF24: // NR50
                    this.ffCh1();
                    this.ffCh2();
                    this.ffCh3();
                    this.ffCh4();

                    let volMulL = ((val >> 4) & 0b111) / 7;
                    let volMulR = ((val >> 0) & 0b111) / 7;
                    this.volMulL = volMulL;
                    this.volMulR = volMulR;
                    break;
                case 0xFF25: // NR51
                    this.ffCh1();
                    this.ffCh2();
                    this.ffCh3();
                    this.ffCh4();

                    this.ch4.enableL = bitTest(val, 7);
                    this.ch3.enableL = bitTest(val, 6);
                    this.ch2.enableL = bitTest(val, 5);
                    this.ch1.enableL = bitTest(val, 4);
                    this.ch4.enableR = bitTest(val, 3);
                    this.ch3.enableR = bitTest(val, 2);
                    this.ch2.enableR = bitTest(val, 1);
                    this.ch1.enableR = bitTest(val, 0);

                    this.addChange(this.ch1, this.gb.constantRateTicks);
                    this.addChange(this.ch2, this.gb.constantRateTicks);
                    this.addChange(this.ch3, this.gb.constantRateTicks);
                    this.addChange(this.ch4, this.gb.constantRateTicks);
                    break;
            }
        }

        switch (addr) {
            case 0xFF26: // NR52
                if (!bitTest(val, 7) && this.enabled) {
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
                    this.ch3.frequencyTimerAccess = 0;
                    this.ch4.frequencyTimer = 0;

                    // Upon turning on the APU, the frame sequencer requires an extra trigger to begin functioning.
                    this.frameSequencerStep = 255;
                } else if (bitTest(val, 7) && !this.enabled) {
                    this.ch1.time = this.gb.constantRateTicks;
                    this.ch2.time = this.gb.constantRateTicks;
                    this.ch3.time = this.gb.constantRateTicks;
                    this.ch4.time = this.gb.constantRateTicks;

                    this.ch1.frequencyTimer = 0;
                    this.ch2.frequencyTimer = 0;
                    this.ch3.frequencyTimer = 0;
                    this.ch3.frequencyTimerAccess = 0;
                    this.ch4.frequencyTimer = 0;
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