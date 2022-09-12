// The entire point of using a filter to downsample is to antialias with subsample resolution in the output signal
// We need to decide how precise our filter is
const KERNEL_RESOLUTION = 1024;
export class BlipBuf {
    // Lanzcos kernel
    kernel: Float64Array = null!;
    kernelSize = 0;

    channelValsL: Float64Array;
    channelValsR: Float64Array;
    channelSample: Float64Array;
    channelRealSample: Float64Array;

    // This is a buffer of differences we are going to write bandlimited impulses to
    bufL: Float64Array = null!;
    bufR: Float64Array = null!;
    bufPos = 0;
    bufSize = 0;

    currentValL = 0;
    currentValR = 0;

    currentSampleInPos = 0;
    currentSampleOutPos = 0;

    constructor(kernelSize: number, normalize: boolean, channels: number, filterRatio: number) {
        this.channelValsL = new Float64Array(channels);
        this.channelValsR = new Float64Array(channels);
        this.channelSample = new Float64Array(channels);
        this.channelRealSample = new Float64Array(channels);

        this.bufSize = 32768;
        this.bufL = new Float64Array(this.bufSize);
        this.bufR = new Float64Array(this.bufSize);

        this.setKernelSize(kernelSize, normalize, filterRatio);
    }

    setKernelSize(kernelSize: number, normalize: boolean, filterRatio: number) {
        this.kernel = new Float64Array(kernelSize * KERNEL_RESOLUTION);
        this.kernelSize = kernelSize;

        if ((kernelSize & (kernelSize - 1)) != 0) {
            throw "kernelSize not power of 2:" + kernelSize;
        }

        if (filterRatio <= 0 || filterRatio > Math.PI) {
            throw "invalid filterRatio, outside of (0, pi]";
        } 

        // Generate the normalized Lanzcos kernel
        // Derived from Wikipedia https://en.wikipedia.org/wiki/Lanczos_resampling
        for (let i = 0; i < KERNEL_RESOLUTION; i++) {
            let sum = 0;
            for (let j = 0; j < kernelSize; j++) {
                let x = j - kernelSize / 2;
                // Shift X coordinate right for subsample accuracy
                // We now have the X coordinates for an impulse bandlimited at the sample rate
                x += (KERNEL_RESOLUTION - i - 1) / KERNEL_RESOLUTION;
                // filterRatio determines the highest frequency that will be generated,
                // as a portion of the Nyquist frequency. e.g. at a sample rate of 48000 hz, the Nyquist frequency
                // will be at 24000 hz, so a filterRatio of 0.5 would set the highest frequency
                // generated at 12000 hz.
                x *= filterRatio * Math.PI;

                // Get the sinc, which represents a bandlimited impulse
                let sinc = Math.sin(x) / x;
                // A sinc function's domain is infinte, meaning 
                // convolving a signal with a true sinc function would take an infinite amount of time
                // To avoid creating a filter with infinite latency, we have to decide when to cut off
                // our sinc function. We can window (i.e. multiply) our true sinc function with a
                // horizontally stretched sinc function to create a windowed sinc function of our desired width. 
                let lanzcosWindow = Math.sin(x / kernelSize) / (x / kernelSize);

                // A hole exists in the sinc function at zero, special case it
                if (x == 0) {
                    this.kernel[i * kernelSize + j] = 1;
                }
                else {
                    // Apply our window here
                    this.kernel[i * kernelSize + j] = sinc * lanzcosWindow;
                }

                sum += this.kernel[i * kernelSize + j];
            }

            if (normalize) {
                for (let j = 0; j < kernelSize; j++) {
                    this.kernel[i * kernelSize + j] /= sum;
                }
            }
        }
    }

    reset() {
        // Flush out the difference buffer
        this.bufPos = 0;
        this.currentValL = 0;
        this.currentValR = 0;
        for (let i = 0; i < this.bufSize; i++) {
            this.bufL[i] = 0;
            this.bufR[i] = 0;
        }
    }

    // Sample is in terms of out samples
    setValue(channel: number, sample: number, valL: number, valR: number, useSinc: boolean) {
        if (sample > this.channelSample[channel]) {
            this.channelSample[channel] = sample;
        } else {
            // TODO: too lazy to fix anything regarding this so I'll just sweep it under the rug for now
            // console.warn(`Channel ${channel}: Tried to set amplitude backward in time from ${this.channelSample[channel]} to ${sample}`);
        }

        if (valL != this.channelValsL[channel] || valR != this.channelValsR[channel]) {
            let diffL = valL - this.channelValsL[channel];
            let diffR = valR - this.channelValsR[channel];

            if (useSinc) {
                let subsamplePos = Math.floor((sample % 1) * KERNEL_RESOLUTION);

                // Add our bandlimited impulse to the difference buffer
                let kBufPos = (this.bufPos + Math.floor(sample) - this.currentSampleOutPos) % this.bufSize;
                for (let i = 0; i < this.kernelSize; i++) {
                    let kVal = this.kernel[this.kernelSize * subsamplePos + i];
                    this.bufL[kBufPos] += kVal * diffL;
                    this.bufR[kBufPos] += kVal * diffR;
                    if (++kBufPos >= this.bufSize) kBufPos = 0;
                }
            } else {
                let kBufPos = (this.bufPos + Math.floor(sample + this.kernelSize) - this.currentSampleOutPos) % this.bufSize;
                this.bufL[kBufPos] += diffL;
                this.bufR[kBufPos] += diffR;
            }
        }

        this.channelValsL[channel] = valL;
        this.channelValsR[channel] = valR;
    }

    readOutSample() {
        // Integrate the difference buffer
        this.currentValL += this.bufL[this.bufPos];
        this.currentValR += this.bufR[this.bufPos];
        this.bufL[this.bufPos] = 0;
        this.bufR[this.bufPos] = 0;
        if (++this.bufPos >= this.bufSize) this.bufPos = 0;
        this.currentSampleOutPos++;
    }
}