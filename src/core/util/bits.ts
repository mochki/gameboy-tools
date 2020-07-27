export const BIT_0 = 1 << 0x0;
export const BIT_1 = 1 << 0x1;
export const BIT_2 = 1 << 0x2;
export const BIT_3 = 1 << 0x3;
export const BIT_4 = 1 << 0x4;
export const BIT_5 = 1 << 0x5;
export const BIT_6 = 1 << 0x6;
export const BIT_7 = 1 << 0x7;
export const BIT_8 = 1 << 0x8;
export const BIT_9 = 1 << 0x9;
export const BIT_10 = 1 << 0xA;
export const BIT_11 = 1 << 0xB;
export const BIT_12 = 1 << 0xC;
export const BIT_13 = 1 << 0xD;
export const BIT_14 = 1 << 0xE;
export const BIT_15 = 1 << 0xF;
export const BIT_16 = 1 << 0x10;

export function bitGet(i: number, bit: number) {
    return (i & (1 << bit)) !== 0;
}

export function bitSet(i: number, bit: number) {
    return i | (1 << bit);
}

export function bitReset(i: number, bit: number) {
    return i & (~(1 << bit));
}

export function bitSetValue(i: number, bit: number, value: boolean) {
    if (value) {
        return i | (1 << bit);
    } else {
        return i & ~(1 << bit);
    }
}