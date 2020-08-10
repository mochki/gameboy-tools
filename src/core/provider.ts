export class GameBoyProvider {
    rom = new Uint8Array(8388608).fill(0xFF);
    bootrom = new Uint8Array(0x100).fill(0xFF);

    constructor(rom: Uint8Array, bootrom?: Uint8Array) {
        this.rom[0x100] = 0x18;
        this.rom[0x101] = 0xFE;

        for (let i = 0; i < rom.length; i++) {
            if (i < this.rom.length) {
                this.rom[i] = rom[i];
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