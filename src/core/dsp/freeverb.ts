// Based off Freeverb, an implementation of Schroeder reverberation, 
// the same algorithm that powers FL Studio's Fruity Reeverb 2 plugin

import { AllPassFilter } from "./all_pass_filter";

const FEEDBACK_COMB_FILTER_COUNT = 16;

export class Freeverb {
    allPassFilters: AllPassFilter[];

    wet = 0.5;

    // Feedback comb filter
    feedbackBuffer: Float64Array[];
    feedbackLowpassBuffer: Float64Array;
    feedbackBufferPos: Float64Array;
    feedbackLength: Float64Array;
    feedbackLowpass: number;

    decay: number = 0;
    decayLinear: number = 0;

    constructor(sampleRate: number, wet: number, decay: number, sampleOffset: number) {
        this.setDecay(decay);
        this.highpass = Math.pow(0.95, 44100 / sampleRate);
        this.wet = wet;
        // Values found in https://ccrma.stanford.edu/~jos/pasp/Freeverb.html
        // I assume I have to scale them from 44100 hz?

        this.feedbackLowpass = Math.pow(0.8, sampleRate / 44100);
        this.feedbackLowpassBuffer = new Float64Array(FEEDBACK_COMB_FILTER_COUNT);
        this.feedbackBufferPos = new Float64Array(FEEDBACK_COMB_FILTER_COUNT);
        this.feedbackLength = new Float64Array(FEEDBACK_COMB_FILTER_COUNT);
        this.feedbackBuffer = new Array(FEEDBACK_COMB_FILTER_COUNT);
        for (let i = 0; i < FEEDBACK_COMB_FILTER_COUNT; i++) {
            // https://www.desmos.com/calculator/jmjsblwacr
            this.feedbackLength[i] = Math.floor((96 * ((i / FEEDBACK_COMB_FILTER_COUNT) ** 2) + 1116) * (sampleRate / 44100) + sampleOffset);
            this.feedbackBuffer[i] = new Float64Array(this.feedbackLength[i]);
        }
        // original Freeverb delays
        // this.feedbackLength[0] = Math.floor(1157 * (sampleRate / 44100));
        // this.feedbackLength[1] = Math.floor(1617 * (sampleRate / 44100));
        // this.feedbackLength[2] = Math.floor(1491 * (sampleRate / 44100));
        // this.feedbackLength[3] = Math.floor(1422 * (sampleRate / 44100));
        // this.feedbackLength[4] = Math.floor(1277 * (sampleRate / 44100));
        // this.feedbackLength[5] = Math.floor(1356 * (sampleRate / 44100));
        // this.feedbackLength[6] = Math.floor(1188 * (sampleRate / 44100));
        // this.feedbackLength[7] = Math.floor(1116 * (sampleRate / 44100));

        this.allPassFilters = new Array(8);
        this.allPassFilters[0] = new AllPassFilter(Math.floor(225 * (sampleRate / 44100)), 0.5);
        this.allPassFilters[1] = new AllPassFilter(Math.floor(556 * (sampleRate / 44100)), 0.5);
        this.allPassFilters[2] = new AllPassFilter(Math.floor(441 * (sampleRate / 44100)), 0.5);
        this.allPassFilters[3] = new AllPassFilter(Math.floor(341 * (sampleRate / 44100)), 0.5);
    }

    setDecay(decayLinear: number) {
        // y = -(x - 1)^2 + 1
        this.decay = -((decayLinear - 1) ** 2) + 1;
        this.decayLinear = decayLinear;
    }

    getDecay(): number {
        return this.decayLinear;
    }

    process(val: number): number {
        let outWet = 0;
        for (let i = 0; i < FEEDBACK_COMB_FILTER_COUNT; i++) {

            this.feedbackBuffer[i][this.feedbackBufferPos[i]] = val + this.feedbackLowpassBuffer[i] * this.decay;

            if (++this.feedbackBufferPos[i] >= this.feedbackLength[i]) this.feedbackBufferPos[i] = 0;
            let delayLineOut = this.feedbackBuffer[i][this.feedbackBufferPos[i]];

            // TODO: maybe lowpass makes it sound better?
            this.feedbackLowpassBuffer[i] = delayLineOut;

            outWet += delayLineOut;
        }

        outWet /= FEEDBACK_COMB_FILTER_COUNT;

        for (let i = 0; i < 4; i++) {
            outWet = this.allPassFilters[i].process(outWet);
        }

        // return outWet;
        return val * (1 - this.wet) + outWet * this.wet;
    }
}