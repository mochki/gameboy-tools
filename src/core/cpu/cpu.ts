import { Bus } from "../bus";
import { GameBoy } from "../gameboy";
import { bitGet as bitTest, bitSet, bitSetValue } from "../util/bits";
import { hexN, hex } from "../util/misc";
import { LD_SP_U16, XOR_R8_R8, LD_BC_U16, LD_DE_U16, LD_HL_U16, LD_iHLinc_A, LD_A_iHLinc, LD_iHLdec_A, LD_A_iHLdec } from "./unprefixed";

function boundsCheck8(i: number): void {
    if ((i & ~0xFF) != 0) throw "Bounds error 8-bit";
}

function boundsCheck16(i: number): void {
    if ((i & ~0xFFFF) != 0) throw "Bounds error 16-bit";
}

export class CPU {
    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    zero = false;
    negative = false;
    halfCarry = false;
    carry = false;

    getF(): number {
        let val = 0;
        val = bitSetValue(val, 7, this.zero);
        val = bitSetValue(val, 6, this.negative);
        val = bitSetValue(val, 5, this.halfCarry);
        val = bitSetValue(val, 4, this.carry);
        return val;
    }
    setF(val: number) {
        this.zero = bitTest(val, 7);
        this.negative = bitTest(val, 6);
        this.halfCarry = bitTest(val, 5);
        this.carry = bitTest(val, 4);
    }

    sp: number = 0;

    pc: number = 0;
    b: number = 0;
    c: number = 0;
    d: number = 0;
    e: number = 0;
    h: number = 0;
    l: number = 0;
    // [hl]
    a: number = 0;

    setAf(val: number) {
        boundsCheck16(val);
        this.a = (val >> 8) & 0xFF;
        this.setF((val >> 0) & 0xFF);
    }
    setBc(val: number) {
        boundsCheck16(val);
        this.b = (val >> 8) & 0xFF;
        this.c = (val >> 0) & 0xFF;
    }
    setDe(val: number) {
        boundsCheck16(val);
        this.d = (val >> 8) & 0xFF;
        this.e = (val >> 0) & 0xFF;
    }
    setHl(val: number) {
        boundsCheck16(val);
        this.h = (val >> 8) & 0xFF;
        this.l = (val >> 0) & 0xFF;
    }

    getAf() {
        let val = 0;
        val |= ((this.a & 0xFF) << 8);
        val |= ((this.getF() & 0xFF) << 0);
        boundsCheck16(val);
        return val;
    }
    getBc() {
        let val = 0;
        val |= (this.b << 8);
        val |= (this.c << 0);
        boundsCheck16(val);
        return val;
    }
    getDe() {
        let val = 0;
        val |= (this.d << 8);
        val |= (this.e << 0);
        boundsCheck16(val);
        return val;
    }
    getHl() {
        let val = 0;
        val |= (this.h << 8);
        val |= (this.l << 0);
        boundsCheck16(val);
        return val;
    }

    execute(): void {
        boundsCheck16(this.pc);
        boundsCheck8(this.b);
        boundsCheck8(this.c);
        boundsCheck8(this.d);
        boundsCheck8(this.e);
        boundsCheck8(this.h);
        boundsCheck8(this.l);
        boundsCheck8(this.a);

        this.gb.resetInfo();

        let val = this.readPcInc();

        if (val != 0xCB) {
            UNPREFIXED_TABLE[val](this, val);
        } else {
            this.gb.info(`Prefix: ${hexN(val, 2)}`);
            val = this.readPcInc();
            this.gb.error("Implement 0xCB prefix");
        }

        this.gb.info(`Opcode: ${hexN(val, 2)}`);
    }

    setReg(reg: number, val: number) {
        boundsCheck8(val);

        switch (reg) {
            case 0b000: // B
                this.b = val;
                break;
            case 0b001: // C
                this.c = val;
                break;
            case 0b010: // D
                this.d = val;
                break;
            case 0b011: // E
                this.e = val;
                break;
            case 0b100: // H
                this.h = val;
                break;
            case 0b101: // L 
                this.l = val;
                break;
            case 0b110: // [HL] 
                return this.writeIndirectHl(val);
                break;
            case 0b111: // A 
                this.a = val;
                break;

            default:
                this.gb.error("setReg <reg> error");
        }
    }

    getReg(reg: number): number {
        switch (reg) {
            case 0b000: // B
                return this.b;
            case 0b001: // C
                return this.c;
            case 0b010: // D
                return this.d;
            case 0b011: // E
                return this.e;
            case 0b100: // H
                return this.h;
            case 0b101: // L 
                return this.l;
            case 0b110: // [HL] 
                return this.readIndirectHl();
            case 0b111: // A 
                return this.a;

            default:
                this.gb.error("getReg <reg> error");
                return 0xFF;
        }
    }

    readIndirectHl(): number {
        return this.gb.bus.read8(this.getHl());
    }

    writeIndirectHl(val: number): void {
        this.gb.bus.write8(this.getHl(), val);
    }


    readPcInc(): number {
        let val = this.gb.bus.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;
        return val;
    }
}

type Instruction = (cpu: CPU, opcode: number) => void;

const UNPREFIXED_TABLE: Instruction[] = genUnprefixedtable();

function genUnprefixedtable(): Instruction[] {
    const t: Instruction[] = new Array(256);
    for (let i = 0; i < 256; i++) {
        t[i] = (cpu) => {
            cpu.gb.error(`Unimplemented unprefixed: ${hex(i, 2)}`);
        };
    }

    t[0x01] = LD_BC_U16;
    t[0x11] = LD_DE_U16;
    t[0x21] = LD_HL_U16;
    t[0x31] = LD_SP_U16;

    t[0x22] = LD_iHLinc_A;
    t[0x2A] = LD_A_iHLinc;
    t[0x32] = LD_iHLdec_A;
    t[0x3A] = LD_A_iHLdec;

    t[0xA8] = XOR_R8_R8;
    t[0xA9] = XOR_R8_R8;
    t[0xAA] = XOR_R8_R8;
    t[0xAB] = XOR_R8_R8;
    t[0xAC] = XOR_R8_R8;
    t[0xAD] = XOR_R8_R8;
    t[0xAE] = XOR_R8_R8;
    t[0xAF] = XOR_R8_R8;

    return t;
}

