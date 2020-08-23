export class GameBoyProvider {
    rom = new Uint8Array(8388608).fill(0xFF);
    bootrom = new Uint8Array(0x100).fill(0xFF);

    cheatsAddrs = new Uint8Array(65536); // Boolean array of enabled cheats
    cheatsValues = new Uint8Array(65536); // Values of cheats
    cheats = new Map<number, number>();

    addCheat(addr: number, val: number) {
        this.cheatsAddrs[addr] = 1;
        this.cheatsValues[addr] = val;
        this.cheats.set(addr, val);
    }

    removeCheat(addr: number) {
        this.cheatsAddrs[addr] = 0;
        this.cheatsValues[addr] = 0;
        this.cheats.delete(addr);
    }

    constructor(rom?: Uint8Array, bootrom?: Uint8Array) {
        this.rom[0x100] = 0x18; // JR NZ, -2
        this.rom[0x101] = 0xFE;

        if (rom) {
            for (let i = 0; i < rom.length; i++) {
                if (i < this.rom.length) {
                    this.rom[i] = rom[i];
                }
            }
        }
        if (bootrom) {
            for (let i = 0; i < bootrom.length; i++) {
                if (i < bootrom.length) {
                    this.bootrom[i] = bootrom[i];
                }
            }
        }
    }
}