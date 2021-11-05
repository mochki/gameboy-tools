export class FeedbackCombFilter {
    buffer: Float64Array;
    bufferPos: number = 0;

    decay = 0.84;
    lowpass: number;

    lowpassBuf = 0;

    constructor(sampleRate: number, decay: number, lengthSamples: number) {
        this.buffer = new Float64Array(lengthSamples);
        this.decay = decay;
        this.lowpass = Math.pow(0.8, sampleRate / 44100);
    }

    process(val: number): number {
        this.buffer[this.bufferPos] = val + this.lowpassBuf * this.decay;

        if (++this.bufferPos >= this.buffer.length) this.bufferPos = 0;
        let delayLineOut = this.buffer[this.bufferPos];

        // lowpass
        // this.lowpassBuf = (1 - this.lowpassBuf) / (1 - this.lowpassBuf / this.lowpass);
        this.lowpassBuf = delayLineOut; // TODO: maybe lowpass makes it sound better?

        return delayLineOut;
    }
}