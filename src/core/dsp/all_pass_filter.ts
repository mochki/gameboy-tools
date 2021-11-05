// I couldn't figure out how to implement this by myself,
// so I directly took the code from Freeverb

export class AllPassFilter {
    buffer: Float64Array;
    bufferPos: number = 0;

    feedback: number;

    constructor(bufferSize: number, feedback: number) {
        this.buffer = new Float64Array(bufferSize);
        this.feedback = feedback;
    }

    process(val: number): number {
        let bufferOut = this.buffer[this.bufferPos];
        let output = -val + bufferOut;
        this.buffer[this.bufferPos] = val + bufferOut * this.feedback;
        if (++this.bufferPos >= this.buffer.length) this.bufferPos = 0;
        return output;
    }
}