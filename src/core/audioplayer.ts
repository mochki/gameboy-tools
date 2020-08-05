let safariHax = false;
if (!AudioBuffer.prototype.copyToChannel) safariHax = true;

let firefoxHax = false;
try {
    new AudioContext({ sampleRate: 262144 });
} catch {
    if (!safariHax)
        firefoxHax = true;
}

export const NORMAL_SAMPLE_RATE = 262144;
export const SAMPLE_RATE = firefoxHax ? 131072 : (safariHax ? 65536 : NORMAL_SAMPLE_RATE);
export const LATENCY = firefoxHax ? 4096 : (safariHax ? 2048 : 8192);
export const LATENCY_SEC = LATENCY / SAMPLE_RATE;

function genBufferPool(ctx: AudioContext, count: number, length: number, sampleRate: number): AudioBuffer[] {
    let pool = new Array(count);
    for (let i = 0; i < count; i++) {
        pool[i] = ctx.createBuffer(2, length, sampleRate);
    }
    return pool;
}

export class AudioPlayer {
    bufferLength: number;
    sampleRate: number;

    bufferPool: AudioBuffer[];
    bufferPoolAt = 0;


    constructor(bufferLength: number, sampleRate: number) {
        this.bufferLength = bufferLength;
        this.sampleRate = sampleRate;
        const AudioContext = window.AudioContext   // Normal browsers
            || (window as any).webkitAudioContext; // Sigh... Safari

        this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });

        this.bufferPool = genBufferPool(this.ctx, 256, this.bufferLength, this.sampleRate);

        const fixAudioContext = () => {
            // Create empty buffer
            let buffer = this.ctx.createBuffer(1, 1, 22050);
            let source = this.ctx.createBufferSource();
            source.buffer = buffer;
            // Connect to output (speakers)
            source.connect(this.ctx.destination);
            // Play sound
            if (source.start) {
                source.start(0);
            } else if ((source as any).play) {
                (source as any).play(0);
            } else if ((source as any).noteOn) {
                (source as any).noteOn(0);
            }
        };
        // iOS 6-8
        document.addEventListener('touchstart', fixAudioContext);
        // iOS 9
        document.addEventListener('touchend', fixAudioContext);

        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
    }

    gain: GainNode;

    ctx: AudioContext;
    sourcesPlaying = 0;

    queueAudio(bufferLeft: Float32Array, bufferRight: Float32Array) {
        let buffer = this.bufferPool[this.bufferPoolAt];
        this.bufferPoolAt++;
        this.bufferPoolAt &= 255;

        if (!safariHax) {
            buffer.copyToChannel(bufferLeft, 0);
            buffer.copyToChannel(bufferRight, 1);
        } else {
            buffer.getChannelData(0).set(bufferLeft);
            buffer.getChannelData(1).set(bufferRight);
        }

        let bufferSource = this.ctx.createBufferSource();

        bufferSource.onended = () => { this.sourcesPlaying-- };

        if (this.audioSec <= this.ctx.currentTime + 0.02) {
            // Reset time if close to buffer underrun
            this.audioSec = this.ctx.currentTime + 0.06;
        }
        bufferSource.buffer = buffer;
        bufferSource.connect(this.gain);
        bufferSource.start(this.audioSec);

        this.sampleRate = this.sampleRate;
        this.audioSec += this.bufferLength / this.sampleRate;

        this.sourcesPlaying++;
    }

    audioSec = 0;

    reset() {
        // 50 ms buffer
        this.audioSec = this.ctx.currentTime + 0.06;
        // console.log(`Latency in seconds: ${(LATENCY / this.sampleRate)}`)
    }
}