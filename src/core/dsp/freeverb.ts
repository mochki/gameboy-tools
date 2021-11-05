// Based off Freeverb, an implementation of Schroeder reverberation, 
// the same algorithm that powers FL Studio's Fruity Reeverb 2 plugin

import { AllPassFilter } from "./all_pass_filter";
import { FeedbackCombFilter } from "./feedback_comb_filter";

const FEEDBACK_COMB_FILTER_COUNT = 16;

export class Freeverb {
    feedbackCombFilters: FeedbackCombFilter[];
    allPassFilters: AllPassFilter[];

    wet = 0.5;

    highpass = 0;
    highpassBuf = 0;

    useAllPass = true;

    constructor(sampleRate: number, wet: number, decay: number, sampleOffset: number) {
        this.highpass = Math.pow(0.95, 44100 / sampleRate);
        this.wet = wet;
        // Values found in https://ccrma.stanford.edu/~jos/pasp/Freeverb.html
        // I assume I have to scale them from 44100 hz?

        this.feedbackCombFilters = new Array(FEEDBACK_COMB_FILTER_COUNT);
        for (let i = 0; i < FEEDBACK_COMB_FILTER_COUNT; i++) {
            // https://www.desmos.com/calculator/jmjsblwacr
            this.feedbackCombFilters[i] = new FeedbackCombFilter(sampleRate, decay, Math.floor((96 * ((i / FEEDBACK_COMB_FILTER_COUNT) ** 2) + 1116) * (sampleRate / 44100) + sampleOffset));
        }
        // original Freeverb delays
        // this.feedbackCombFilters[0] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1157 * (sampleRate / 44100)) + sampleOffset);
        // this.feedbackCombFilters[1] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1617 * (sampleRate / 44100)) + sampleOffset);
        // this.feedbackCombFilters[2] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1491 * (sampleRate / 44100)) + sampleOffset);
        // this.feedbackCombFilters[3] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1422 * (sampleRate / 44100)) + sampleOffset);
        // this.feedbackCombFilters[4] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1277 * (sampleRate / 44100)) + sampleOffset);
        // this.feedbackCombFilters[5] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1356 * (sampleRate / 44100)) + sampleOffset);
        // this.feedbackCombFilters[6] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1188 * (sampleRate / 44100)) + sampleOffset);
        // this.feedbackCombFilters[7] = new FeedbackCombFilter(sampleRate, decay, Math.floor(1116 * (sampleRate / 44100)) + sampleOffset);

        this.allPassFilters = new Array(8);
        this.allPassFilters[0] = new AllPassFilter(Math.floor(225 * (sampleRate / 44100)), 0.5);
        this.allPassFilters[1] = new AllPassFilter(Math.floor(556 * (sampleRate / 44100)), 0.5);
        this.allPassFilters[2] = new AllPassFilter(Math.floor(441 * (sampleRate / 44100)), 0.5);
        this.allPassFilters[3] = new AllPassFilter(Math.floor(341 * (sampleRate / 44100)), 0.5);
    }

    setDecay(decay: number) {
        for (let i = 0; i < FEEDBACK_COMB_FILTER_COUNT; i++) {
            this.feedbackCombFilters[i].decay = decay;
        }
    }

    process(val: number): number {
        let outWet = 0;
        for (let i = 0; i < FEEDBACK_COMB_FILTER_COUNT; i++) {
            outWet += this.feedbackCombFilters[i].process(val);
        }
        if (this.useAllPass) {
            for (let i = 0; i < 4; i++) {
                outWet = this.allPassFilters[i].process(outWet);
            }
        }

        // wet output is too bassy for my liking, apply a IIR high pass
        let finalWet = outWet - this.highpassBuf;
        this.highpassBuf = outWet - finalWet * this.highpass;

        return val * (1 - this.wet) + (finalWet / FEEDBACK_COMB_FILTER_COUNT) * this.wet;
    }
}