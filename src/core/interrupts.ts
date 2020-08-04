import { bitSet, bitTest, bitReset } from "./util/bits";

export enum InterruptId {
    Vblank = 0,
    Stat = 1,
    Timer = 2,
    Serial = 3,
    Joypad = 4,
}

export class Interrupts {

}