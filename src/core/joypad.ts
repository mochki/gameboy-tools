import { bitTest, bitReset } from "./util/bits";

export class Joypad {
    selectButtons = false;
    selectDpad = false;
    
    start = false;
    select = false;
    b = false;
    a = false;

    down = false;
    up = false;
    left = false;
    right = false;

    readHwio8(): number {
        let val = 0xff;
        if (this.selectButtons) {
            if (this.start) val = bitReset(val, 3);
            if (this.select) val = bitReset(val, 2);
            if (this.b) val = bitReset(val, 1);
            if (this.a) val = bitReset(val, 0);
        }
        if (this.selectDpad) {
            if (this.down) val = bitReset(val, 3);
            if (this.up) val = bitReset(val, 2);
            if (this.left) val = bitReset(val, 1);
            if (this.right) val = bitReset(val, 0);
        }
        return val;
    }

    writeHwio8(val: number): void {
        this.selectButtons = !bitTest(val, 5);
        this.selectDpad = !bitTest(val, 4);
    }
}