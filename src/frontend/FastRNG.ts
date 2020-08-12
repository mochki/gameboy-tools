export class FastRNG {
    x = 123456789;
    y = 362436069;
    z = 521288629;

    // xorshf96
    next(): number {
        let t = 0;
        this.x ^= this.x << 16;
        this.x ^= this.x >> 5;
        this.x ^= this.x << 1;

        t = this.x;
        this.x = this.y;
        this.y = this.z;
        this.z = t ^ this.x ^ this.y;

        return this.z;
    }
}