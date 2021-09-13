// The entire point of using a filter to downsample is to antialias with subsample resolution in the output signal
// We need to decide how precise our filter is
const KERNEL_RESOLUTION = 1024;
export class LanzcosResampler {
    // Lanzcos kernel
    kernel: Float64Array = null!;
    kernelSize = 0;

    channelVals: Float64Array;
    channelSample: Float64Array;
    channelRealSample: Float64Array;

    // This is a buffer of differences we are going to write bandlimited impulses to
    buf: Float64Array = null!;
    bufPos = 0;
    bufSize = 0;

    currentVal = 0;

    currentSampleInPos = 0;
    currentSampleOutPos = 0;

    constructor(kernelSize: number, normalize: boolean, channels: number) {
        this.channelVals = new Float64Array(channels);
        this.channelSample = new Float64Array(channels);
        this.channelRealSample = new Float64Array(channels);

        this.bufSize = 32768;
        this.buf = new Float64Array(this.bufSize);

        this.setKernelSize(kernelSize, normalize, true);
    }

    setKernelSize(kernelSize: number, normalize: boolean, enabled: boolean) {
        this.kernel = new Float64Array(kernelSize * KERNEL_RESOLUTION);
        this.kernelSize = kernelSize;

        if ((kernelSize & (kernelSize - 1)) != 0) {
            throw "kernelSize not power of 2:" + kernelSize;
        }

        // Generate the normalized Lanzcos kernel
        // Derived blindly from Wikipedia https://en.wikipedia.org/wiki/Lanczos_resampling
        for (let i = 0; i < KERNEL_RESOLUTION; i++) {
            let sum = 0;
            for (let j = 0; j < kernelSize; j++) {
                if (enabled) {
                    let x = j - kernelSize / 2;
                    // Shift X coordinate right for subsample accuracy
                    // We now have the X coordinates for an impulse bandlimited at the sample rate
                    x += (KERNEL_RESOLUTION - i - 1) / KERNEL_RESOLUTION;
                    // Horizontally compress by two, so that our impulse is bandlimited at the Nyquist limit, half of the sample rate
                    x *= 2;

                    // Get the sinc, which represents a bandlimited impulse
                    let sinc = Math.sin(x) / x;
                    // Unfortunately, a sinc function's domain is infinte, meaning 
                    // filtering a signal with a true sinc function would take an infinite amount of time
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
                } else {
                    if (j == kernelSize / 2) {
                        this.kernel[i * kernelSize + j] = 1;
                    } else {
                        this.kernel[i * kernelSize + j] = 0;
                    }
                }
            }

            if (normalize && enabled) {
                for (let j = 0; j < kernelSize; j++) {
                    this.kernel[i * kernelSize + j] /= sum;
                }
            }
        }

        // this.reset();
    }

    reset() {
        // Flush out the difference buffer
        this.bufPos = 0;
        this.currentVal = 0;
        for (let i = 0; i < this.bufSize; i++) {
            this.buf[i] = 0;
        }
    }

    // Sample is in terms of out samples
    setValue(channel: number, sample: number, val: number, ratio: number) {
        // Tracking to allow submitting value for different channels out of order 
        let realSample = sample;
        let dist = sample - this.channelRealSample[channel];
        sample = this.channelSample[channel] + dist * ratio;

        if (sample >= this.currentSampleInPos) {
            this.currentSampleInPos = sample;
        } else if (sample < this.currentSampleOutPos) {
            throw "Tried to set amplitude backward in time";
        }

        this.channelSample[channel] = sample;
        this.channelRealSample[channel] = realSample;

        if (val != this.channelVals[channel]) {
            let diff = val - this.channelVals[channel];

            let subsamplePos = Math.floor((sample % 1) * KERNEL_RESOLUTION);

            // Add our bandlimited impulse to the difference buffer
            let kBufPos = (this.bufPos + (Math.floor(sample) - this.currentSampleOutPos)) % this.bufSize;
            for (let i = 0; i < this.kernelSize; i++) {
                this.buf[kBufPos] += this.kernel[this.kernelSize * subsamplePos + i] * diff;
                kBufPos = (kBufPos + 1) % this.bufSize;
            }
        }

        this.channelVals[channel] = val;
    }

    readOutSample() {
        // Add our difference to the current value and return the current value
        this.currentVal += this.buf[this.bufPos];
        this.buf[this.bufPos] = 0;
        this.bufPos = (this.bufPos + 1) % this.bufSize;
        this.currentSampleOutPos++;
        return this.currentVal;
    }
}