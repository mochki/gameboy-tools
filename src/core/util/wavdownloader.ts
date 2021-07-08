export class WavDownloader {
    sampleRate: number;
    name: string;

    constructor(sampleRate: number, name: string) {
        this.sampleRate = sampleRate;
        this.name = name;
    }

    recordBuffer = new Uint8ClampedArray(32);
    recordBufferAt = 0;
    addSamples(left: Float32Array, right: Float32Array, size: number) {
        for (let i = 0; i < size; i++) {
            this.addSample(left[i], right[i]);
        }
    }

    addSample(left: number, right: number) {
        const out1_8bit = Math.floor(((left + 1) / 2) * 255);
        const out2_8bit = Math.floor(((right + 1) / 2) * 255);

        // This is literally a C++ vector. In freaking TypeScript.
        // I need to reevaluate my life choices.
        if (this.recordBufferAt + 2 > this.recordBuffer.length) {
            const oldBuf = this.recordBuffer;
            this.recordBuffer = new Uint8ClampedArray(this.recordBufferAt * 2);
            this.recordBuffer.set(oldBuf);
        }

        this.recordBuffer[this.recordBufferAt++] = out1_8bit;
        this.recordBuffer[this.recordBufferAt++] = out2_8bit;
    }

    download() {
        // Allocate exactly enough for a WAV header
        const wave = new Uint8Array(this.recordBufferAt + 44);

        // RIFF header
        wave[0] = 0x52;
        wave[1] = 0x49;
        wave[2] = 0x46;
        wave[3] = 0x46;

        const size = wave.length - 8;
        wave[4] = (size >> 0) & 0xFF;
        wave[5] = (size >> 8) & 0xFF;
        wave[6] = (size >> 16) & 0xFF;
        wave[7] = (size >> 24) & 0xFF;

        // WAVE
        wave[8] = 0x57;
        wave[9] = 0x41;
        wave[10] = 0x56;
        wave[11] = 0x45;

        // Subchunk1ID "fmt "
        wave[12] = 0x66;
        wave[13] = 0x6d;
        wave[14] = 0x74;
        wave[15] = 0x20;

        // Subchunk1Size
        wave[16] = 16;
        wave[17] = 0;
        wave[18] = 0;
        wave[19] = 0;

        // AudioFormat
        wave[20] = 1;
        wave[21] = 0;

        // 2 channels
        wave[22] = 2;
        wave[23] = 0;

        // Sample rate
        wave[24] = (this.sampleRate >> 0) & 0xFF;
        wave[25] = (this.sampleRate >> 8) & 0xFF;
        wave[26] = (this.sampleRate >> 16) & 0xFF;
        wave[27] = (this.sampleRate >> 24) & 0xFF;

        // ByteRate
        // SampleRate & NumChannels * BitsPerSample/8
        const byteRate = this.sampleRate * 2 * (8 / 8);
        wave[28] = (byteRate >> 0) & 0xFF;
        wave[29] = (byteRate >> 8) & 0xFF;
        wave[30] = (byteRate >> 16) & 0xFF;
        wave[31] = (byteRate >> 24) & 0xFF;

        // BlockAlign
        // NumChannels * BitsPerSample / 8
        const blockAlign = 2 * (8 / 8);
        wave[32] = (blockAlign >> 0) & 0xFF;
        wave[33] = (blockAlign >> 8) & 0xFF;

        // BitsPerSample
        wave[34] = 8;
        wave[35] = 0;

        // Subchunk2ID "data"
        wave[36] = 0x64;
        wave[37] = 0x61;
        wave[38] = 0x74;
        wave[39] = 0x61;

        // NumSamples * NumChannels * BitsPerSample/8
        const subchunk2Size = this.recordBufferAt * 2 * (8 / 8);
        wave[40] = (subchunk2Size >> 0) & 0xFF;
        wave[41] = (subchunk2Size >> 8) & 0xFF;
        wave[42] = (subchunk2Size >> 16) & 0xFF;
        wave[43] = (subchunk2Size >> 24) & 0xFF;

        for (let i = 0; i < this.recordBufferAt; i++) {
            wave[44 + i] = this.recordBuffer[i];
        }

        let blob = new Blob([wave], { type: "application/octet-stream" });
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${this.name}.wav`;
        link.click();
    }
}