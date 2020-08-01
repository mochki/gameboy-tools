import { bitTest } from "./util/bits";
import { GameBoy } from "./gameboy";
import { SchedulerId } from "./scheduler";
import { AudioPlayer } from "./audioplayer";
import { GetTextLineHeightWithSpacing } from "../lib/imgui-js/imgui";

// Starts from NR10 / 0xFF10
const regMask = Uint8Array.from([
    0x80, 0x3F, 0x00, 0xFF, 0xBF,
    0xFF, 0x3F, 0x00, 0xFF, 0xBF,
    0x7F, 0xFF, 0x9F, 0xFF, 0xBF,
    0xFF, 0xFF, 0x00, 0x00, 0xBF,
    0x00, 0x00, 0x70
]);

const pulseDuty = [
    Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 1]),
    Uint8Array.from([1, 0, 0, 0, 0, 0, 0, 1]),
    Uint8Array.from([1, 0, 0, 0, 0, 1, 1, 1]),
    Uint8Array.from([0, 1, 1, 1, 1, 1, 1, 0]),
];

const waveShiftCodes = Uint8Array.from([4, 0, 1, 2]);
const noiseDivisors = Uint8Array.from([8, 16, 32, 48, 64, 80, 96, 112]);

export class APU {

    gb: GameBoy;
    constructor(gb: GameBoy) {
        this.gb = gb;

        this.gb.scheduler.addEventRelative(SchedulerId.APUChannel1, 16, this.advanceCh1);
        this.gb.scheduler.addEventRelative(SchedulerId.APUChannel2, 16, this.advanceCh2);
        this.gb.scheduler.addEventRelative(SchedulerId.APUChannel3, 16, this.advanceCh3);
    }

    frameSequencerStep = 0;
    advanceFrameSequencer = function (this: APU) {
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

        this.gb.scheduler.addEventRelative(SchedulerId.TimerAPUFrameSequencer, 8192, this.advanceFrameSequencer);
    }.bind(this);

    clockLength() {
        if (this.ch1.useLength) {
            if (this.ch1.lengthTimer <= 0) {
                this.ch1.enabled = false;
                this.ch1.updateDac();
            } else {
                this.ch1.lengthTimer--;
            }
        }
        if (this.ch2.useLength) {
            if (this.ch2.lengthTimer <= 0) {
                this.ch2.enabled = false;
                this.ch2.updateDac();
            } else {
                this.ch2.lengthTimer--;
            }
        }
        if (this.ch3.useLength) {
            if (this.ch3.lengthTimer <= 0) {
                this.ch3.enabled = false;
                this.ch3.updateDac();
            } else {
                this.ch3.lengthTimer--;
            }
        }
        if (this.ch4.useLength) {
            if (this.ch4.lengthTimer <= 0) {
                this.ch4.enabled = false;
                this.ch4.updateDac();
            } else {
                this.ch4.lengthTimer--;
            }
        }
    }
    clockSweep() {

    }
    clockEnvelope() {
        if (this.ch1.envelopePeriod != 0) {
            if (this.ch1.envelopeTimer <= 0) {
                this.ch1.envelopeTimer = this.ch1.envelopePeriod;

                let volume = this.ch1.volume;
                if (this.ch1.envelopeIncrease) {
                    volume++;
                } else {
                    volume--;
                }

                if (volume >= 0 && volume <= 15) {
                    this.ch1.volume = volume;
                    this.ch1.updateDac();
                }
            }
            this.ch1.envelopeTimer--;
        }
        if (this.ch2.envelopePeriod != 0) {
            if (this.ch2.envelopeTimer <= 0) {
                this.ch2.envelopeTimer = this.ch2.envelopePeriod;

                let volume = this.ch2.volume;
                if (this.ch2.envelopeIncrease) {
                    volume++;
                } else {
                    volume--;
                }

                if (volume >= 0 && volume <= 15) {
                    this.ch2.volume = volume;
                    this.ch2.updateDac();
                }
            }
            this.ch2.envelopeTimer--;
        }

        if (this.ch4.envelopePeriod != 0) {
            if (this.ch4.envelopeTimer <= 0) {
                this.ch4.envelopeTimer = this.ch4.envelopePeriod;

                let volume = this.ch4.volume;
                if (this.ch4.envelopeIncrease) {
                    volume++;
                } else {
                    volume--;
                }

                if (volume >= 0 && volume <= 15) {
                    this.ch4.volume = volume;
                    this.ch4.updateDac();
                }
            }
            this.ch4.envelopeTimer--;
        }
    }

    ch1 = {
        // Internal state
        enabled: false,
        dacEnabled: false,

        pos: 0,
        currentVal: 0,
        dacOut: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,
        lengthTimer: 0,
        // -------

        // NR10
        sweepTime: 0,
        sweepIncrease: false,
        sweepShift: 0,

        // NR11
        duty: 2,
        length: 0,

        // NR12
        envelopeInitial: 0,
        envelopeIncrease: false,
        envelopePeriod: 0,

        // NR13
        // NR14
        frequency: 0,
        useLength: false,

        frequencyPeriod: 256,

        trigger: function () {
            this.pos = 0;
            this.enabled = true;
            this.volume = this.envelopeInitial;
            this.lengthTimer = 64 - this.length;
        },

        updateDac: function () {
            this.dacOut = ((this.currentVal * this.volume) / (15 / 2)) - 1;
        }
    };

    ch2 = {
        // Internal state
        enabled: false,
        dacEnabled: false,

        pos: 0,
        currentVal: 0,
        dacOut: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,
        lengthTimer: 0,
        // -------

        // NR21
        duty: 2,
        length: 0,

        // NR22
        envelopeInitial: 0,
        envelopeIncrease: false,
        envelopePeriod: 0,

        // NR23
        // NR24
        frequency: 0,
        useLength: false,

        frequencyPeriod: 256,

        trigger: function () {
            this.pos = 0;
            this.enabled = true;
            this.volume = this.envelopeInitial;
            this.lengthTimer = 64 - this.length;
        },

        updateDac: function () {
            this.dacOut = ((this.currentVal * this.volume) / (15 / 2)) - 1;
        }
    };

    ch3 = {
        // Internal state
        enabled: false,
        dacEnabled: false,

        pos: 0,
        currentVal: 0,
        dacOut: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,
        lengthTimer: 0,

        waveTable: new Uint8Array(32),

        volumeShift: 0,
        // -------

        // NR31
        length: 0,

        // NR32
        volumeCode: 0,

        // NR33
        // NR34
        frequency: 0,
        useLength: false,

        frequencyPeriod: 256,

        trigger: function () {
            this.pos = 0;
            this.enabled = true;
            this.lengthTimer = 256 - this.length;
        },

        updateDac() {
            if (this.dacEnabled) {
                this.dacOut = ((this.currentVal >> this.volumeShift) / (15 / 2)) - 1;
            } else {
                this.dacOut = 0;
            }
        }
    };

    ch4 = {
        // Internal state
        enabled: false,
        dacEnabled: false,

        currentVal: 0,
        dacOut: 0,

        frequencyTimer: 0,

        envelopeTimer: 0,
        volume: 0,

        lengthCounter: 0,
        lengthTimer: 0,

        lfsr: 0,
        // -------

        // NR41
        duty: 2,
        length: 0,

        // NR42
        envelopeInitial: 0,
        envelopeIncrease: false,
        envelopePeriod: 0,

        // NR43
        frequencyShift: 0,
        sevenBit: false,
        divisorCode: 0,

        // NR44
        useLength: false,
        frequencyPeriod: 256,

        trigger: function () {
            this.enabled = true;
            this.volume = this.envelopeInitial;
            this.lengthTimer = 64 - this.length;
            this.lfsr = 0x7FFF;
        },

        updateDac: function () {
            this.dacOut = ((this.currentVal * this.volume) / (15 / 2)) - 1;
        }
    };

    advanceCh1 = function (this: APU, cyclesLate: number) {
        this.ch1.pos++;
        this.ch1.pos &= 7;

        this.ch1.currentVal = pulseDuty[this.ch1.duty][this.ch1.pos];

        this.ch1.updateDac();
        this.gb.scheduler.addEventRelative(SchedulerId.APUChannel1, this.ch1.frequencyPeriod - cyclesLate, this.advanceCh1);
    }.bind(this);

    advanceCh2 = function (this: APU, cyclesLate: number) {
        this.ch2.pos++;
        this.ch2.pos &= 7;

        this.ch2.currentVal = pulseDuty[this.ch2.duty][this.ch2.pos];

        this.ch2.updateDac();
        this.gb.scheduler.addEventRelative(SchedulerId.APUChannel2, this.ch2.frequencyPeriod - cyclesLate, this.advanceCh2);
    }.bind(this);

    advanceCh3 = function (this: APU, cyclesLate: number) {
        this.ch3.pos++;
        this.ch3.pos &= 31;

        this.ch3.currentVal = this.ch3.waveTable[this.ch3.pos];

        this.ch3.updateDac();
        this.gb.scheduler.addEventRelative(SchedulerId.APUChannel3, this.ch3.frequencyPeriod - cyclesLate, this.advanceCh3);
    }.bind(this);

    advanceCh4() {
        let lfsr = this.ch4.lfsr;
        let xored = ((lfsr) ^ (lfsr >> 1)) & 1;
        lfsr >>= 1;
        lfsr |= (xored << 14);
        if (this.ch4.sevenBit) {
            lfsr |= (xored << 5);
        }
        this.ch4.lfsr = lfsr;

        this.ch4.currentVal = xored ^ 1;

        this.ch4.updateDac();
    }

    player = new AudioPlayer();

    sampleBufL = new Float32Array(2048);
    sampleBufR = new Float32Array(2048);
    sampleBufMax = 2048;
    sampleBufPos = 0;

    sample() {

        let final = 0;

        if (this.ch1.enabled) {
            final += this.ch1.dacOut;
        }
        if (this.ch2.enabled) {
            final += this.ch2.dacOut;
        }
        if (this.ch3.enabled) {
            final += this.ch3.dacOut;
        }
        if (this.ch4.enabled) {
            // Channel 4 can be advanced far too often to be efficient for the scheduler
            this.ch4.frequencyTimer -= 4194304 / 262144;
            if (this.ch4.frequencyTimer <= 0) {
                this.ch4.frequencyTimer += this.ch4.frequencyPeriod;
                this.advanceCh4();
            }
            final += this.ch4.dacOut;
        }

        this.sampleBufL[this.sampleBufPos] = final / 32;
        this.sampleBufR[this.sampleBufPos] = final / 32;
        this.sampleBufPos++;
        if (this.sampleBufPos >= this.sampleBufMax) {
            this.sampleBufPos = 0;
            this.player.queueAudio(this.sampleBufL, this.sampleBufR, 262144);
        }
    }

    readHwio8(addr: number): number {
        return 0xFF;
    }
    writeHwio8(addr: number, val: number): void {
        switch (addr) {
            case 0xFF10: // NR10
                this.ch1.sweepShift = (val >> 0) & 0b111;
                this.ch1.sweepIncrease = bitTest(val, 3);
                this.ch1.sweepTime = (val >> 4) & 0b111;
                this.ch1.updateDac();
                break;
            case 0xFF11: // NR11
                this.ch1.length = (val >> 0) & 0b111111;
                this.ch1.duty = (val >> 6) & 0b11;
                this.ch1.updateDac();
                break;
            case 0xFF12: // NR12
                this.ch1.envelopePeriod = (val >> 0) & 0b111;
                this.ch1.envelopeIncrease = bitTest(val, 3);
                this.ch1.envelopeInitial = (val >> 4) & 0b1111;
                this.ch1.updateDac();
                break;
            case 0xFF13: // NR13
                this.ch1.frequency &= 0b11100000000;
                this.ch1.frequency |= ((val & 0xFF) << 0);

                this.ch1.frequencyPeriod = (2048 - this.ch1.frequency) * 4;
                this.ch1.updateDac();
                break;
            case 0xFF14: // NR14
                this.ch1.frequency &= 0b00011111111;
                this.ch1.frequency |= ((val & 0b111) << 8);
                this.ch1.useLength = bitTest(val, 6);
                if (bitTest(val, 7)) this.ch1.trigger();

                this.ch1.frequencyPeriod = (2048 - this.ch1.frequency) * 4;
                this.ch1.updateDac();
                break;

            case 0xFF16: // NR21
                this.ch2.length = (val >> 0) & 0b111111;
                this.ch2.duty = (val >> 6) & 0b11;
                this.ch2.updateDac();
                break;
            case 0xFF17: // NR22
                this.ch2.envelopePeriod = (val >> 0) & 0b111;
                this.ch2.envelopeIncrease = bitTest(val, 3);
                this.ch2.envelopeInitial = (val >> 4) & 0b1111;
                this.ch2.updateDac();
                break;
            case 0xFF18: // NR23
                this.ch2.frequency &= 0b11100000000;
                this.ch2.frequency |= ((val & 0xFF) << 0);

                this.ch2.frequencyPeriod = (2048 - this.ch2.frequency) * 4;
                this.ch2.updateDac();
                break;
            case 0xFF19: // NR24
                this.ch2.frequency &= 0b00011111111;
                this.ch2.frequency |= ((val & 0b111) << 8);
                this.ch2.useLength = bitTest(val, 6);
                if (bitTest(val, 7)) this.ch2.trigger();

                this.ch2.frequencyPeriod = (2048 - this.ch2.frequency) * 4;
                this.ch2.updateDac();
                break;

            case 0xFF1A: // NR30
                this.ch3.dacEnabled = bitTest(val, 7);
                this.ch3.updateDac();
                break;
            case 0xFF1B: // NR31
                this.ch3.length = (val >> 0) & 0xFF;
                this.ch3.updateDac();
                break;
            case 0xFF1C: // NR32
                this.ch3.volumeCode = (val >> 5) & 0b11;
                this.ch3.volumeShift = waveShiftCodes[this.ch3.volumeCode];
                this.ch3.updateDac();
                break;
            case 0xFF1D: // NR33
                this.ch3.frequency &= 0b11100000000;
                this.ch3.frequency |= ((val & 0xFF) << 0);

                this.ch3.frequencyPeriod = (2048 - this.ch3.frequency) * 2;
                this.ch3.updateDac();
                break;
            case 0xFF1E: // NR34
                this.ch3.frequency &= 0b00011111111;
                this.ch3.frequency |= ((val & 0b111) << 8);
                this.ch3.useLength = bitTest(val, 6);
                if (bitTest(val, 7)) this.ch3.trigger();

                this.ch3.frequencyPeriod = (2048 - this.ch3.frequency) * 2;
                this.ch3.updateDac();
                break;

            case 0xFF20: // NR41
                this.ch4.length = (val >> 0) & 0b111111;
                this.ch4.updateDac();
                break;
            case 0xFF21: // NR42
                this.ch4.envelopePeriod = (val >> 0) & 0b111;
                this.ch4.envelopeIncrease = bitTest(val, 3);
                this.ch4.envelopeInitial = (val >> 4) & 0b1111;
                this.ch4.updateDac();
                break;
            case 0xFF22: // NR43
                this.ch4.frequencyShift = (val >> 4) & 0b1111;
                this.ch4.sevenBit = bitTest(val, 3);
                this.ch4.divisorCode = (val >> 0) & 0b111;

                this.ch4.frequencyPeriod = noiseDivisors[this.ch4.divisorCode] << this.ch4.frequencyShift;
                this.ch4.updateDac();
                break;
            case 0xFF23: // NR44
                this.ch4.useLength = bitTest(val, 6);
                if (bitTest(val, 7)) this.ch4.trigger();
                this.ch4.updateDac();
                break;

            case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37: // Wave Table
            case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F: // Wave Table
                let index = (addr - 0xFF30) * 2;
                this.ch3.waveTable[index + 0] = (val >> 4) & 0xF;
                this.ch3.waveTable[index + 1] = (val >> 0) & 0xF;
                break;
        }
    }
}