import { bitSet, bitTest, bitReset } from "./util/bits";

export const enum InterruptId {
    Vblank = 1 << 0,
    Stat = 1 << 1,
    Timer = 1 << 2,
    Serial = 1 << 3,
    Joypad = 1 << 4,
}
