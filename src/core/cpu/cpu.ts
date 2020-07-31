import { InterruptId } from './../interrupts';
import { Bus } from "../bus";
import { GameBoy } from "../gameboy";
import { bitTest as bitTest, bitSet, bitSetValue } from "../util/bits";
import { hexN, hex } from "../util/misc";
import { BIT, RES, SET, RLC, RRC, RL, RR, SLA, SRA, SWAP, JP_HL, SRL } from "./cb_prefix";
import { Interrupts } from "../interrupts";
import { LD_R8_R8, LD_BC_U16, LD_DE_U16, LD_HL_U16, LD_SP_U16, LD_A_iU16, LD_iU16_A, LD_iU16_SP, JP, JP_CC, CALL, CALL_CC, LD_A_iFF00plusU8, LD_iFF00plusU8_A, LD_iHL_U8, LD_HL_SPplusE8, ADD_SP_E8, AND_A_U8, OR_A_U8, XOR_A_U8, CP_A_U8, JR, ADD_A_U8, ADC_A_U8, SUB_A_U8, SBC_A_U8, LD_R8_U8, LD_SP_HL, PUSH_BC, PUSH_DE, PUSH_HL, PUSH_AF, POP_BC, POP_DE, POP_HL, POP_AF, INC_R8, DEC_R8, INC_BC, INC_DE, INC_HL, INC_SP, DEC_BC, DEC_DE, DEC_HL, DEC_SP, ADD_A_R8, ADC_A_R8, SUB_A_R8, SBC_A_R8, AND_A_R8, XOR_A_R8, OR_A_R8, CP_A_R8, CPL, RETI, DAA, NOP, LD_iBC_A, LD_iDE_A, LD_iHLinc_A, LD_iHLdec_A, LD_A_iBC, LD_A_iDE, LD_A_iHLinc, LD_A_iHLdec, LD_A_iFF00plusC, LD_iFF00plusC_A, DI, EI, RLCA, RRCA, RRA, RLA, HALT, SCF, CCF, RET, RET_CC, RST, ADD_HL_BC, ADD_HL_DE, ADD_HL_HL, ADD_HL_SP } from "./unprefixed";

// function boundsCheck8(i: number): void {
//     if ((i & ~0xFF) != 0) throw "Bounds error 8-bit";
// }

// function boundsCheck16(i: number): void {
//     if ((i & ~0xFFFF) != 0) throw "Bounds error 16-bit";
// }

const VBLANK_VECTOR = 0x40;
const STAT_VECTOR = 0x48;
const TIMER_VECTOR = 0x50;
const SERIAL_VECTOR = 0x58;
const JOYPAD_VECTOR = 0x60;

export class CPU {
    gb: GameBoy;
    bus: Bus;
    interrupts: Interrupts;

    constructor(gb: GameBoy, bus: Bus, interrupts: Interrupts) {
        this.gb = gb;
        this.bus = bus;
        this.interrupts = interrupts;
    }

    read8(addr: number): number {
        this.cycles += 4;
        this.gb.tick(4);
        return this.bus.read8(addr);
    }
    write8(addr: number, val: number) {
        this.cycles += 4;
        this.gb.tick(4);
        this.bus.write8(addr, val);
    }

    tick(cycles: number) {
        this.cycles += cycles;
        this.gb.tick(cycles);
    }

    ime = false;

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
        // boundsCheck16(val);
        this.a = (val >> 8) & 0xFF;
        this.setF((val >> 0) & 0xFF);
    }
    setBc(val: number) {
        // boundsCheck16(val);
        this.b = (val >> 8) & 0xFF;
        this.c = (val >> 0) & 0xFF;
    }
    setDe(val: number) {
        // boundsCheck16(val);
        this.d = (val >> 8) & 0xFF;
        this.e = (val >> 0) & 0xFF;
    }
    setHl(val: number) {
        // boundsCheck16(val);
        this.h = (val >> 8) & 0xFF;
        this.l = (val >> 0) & 0xFF;
    }

    getAf() {
        let val = 0;
        val |= ((this.a & 0xFF) << 8);
        val |= ((this.getF() & 0xFF) << 0);
        // boundsCheck16(val);
        return val;
    }
    getBc() {
        let val = 0;
        val |= (this.b << 8);
        val |= (this.c << 0);
        // boundsCheck16(val);
        return val;
    }
    getDe() {
        let val = 0;
        val |= (this.d << 8);
        val |= (this.e << 0);
        // boundsCheck16(val);
        return val;
    }
    getHl() {
        let val = 0;
        val |= (this.h << 8);
        val |= (this.l << 0);
        // boundsCheck16(val);
        return val;
    }

    cycles = 0;

    execute(): number {
        // boundsCheck16(this.pc);
        // boundsCheck8(this.b);
        // boundsCheck8(this.c);
        // boundsCheck8(this.d);
        // boundsCheck8(this.e);
        // boundsCheck8(this.h);
        // boundsCheck8(this.l);
        // boundsCheck8(this.a);

        // this.gb.resetInfo();
        // if (this.pc == 0xC000) this.gb.error("sadfdfsd");

        if (this.ime && (this.interrupts.if & this.interrupts.ie & 0x1F) != 0) {
            let vector = 0;

            if (
                bitTest(this.interrupts.ie, InterruptId.Vblank) &&
                bitTest(this.interrupts.if, InterruptId.Vblank)
            ) {
                this.interrupts.clearInterrupt(InterruptId.Vblank);
                vector = VBLANK_VECTOR;
            } else if (
                bitTest(this.interrupts.ie, InterruptId.Stat) &&
                bitTest(this.interrupts.if, InterruptId.Stat)
            ) {
                this.interrupts.clearInterrupt(InterruptId.Stat);
                vector = STAT_VECTOR;
            } else if (
                bitTest(this.interrupts.ie, InterruptId.Timer) &&
                bitTest(this.interrupts.if, InterruptId.Timer)
            ) {
                this.interrupts.clearInterrupt(InterruptId.Timer);
                vector = TIMER_VECTOR;
            } else if (
                bitTest(this.interrupts.ie, InterruptId.Serial) &&
                bitTest(this.interrupts.if, InterruptId.Serial)
            ) {
                this.interrupts.clearInterrupt(InterruptId.Serial);
                vector = SERIAL_VECTOR;
            } else if (
                bitTest(this.interrupts.ie, InterruptId.Joypad) &&
                bitTest(this.interrupts.if, InterruptId.Joypad)
            ) {
                this.interrupts.clearInterrupt(InterruptId.Joypad);
                vector = JOYPAD_VECTOR;
            }

            this.ime = false;

            this.push(this.pc);
            this.pc = vector;
        }

        // let origPc = this.pc;
        this.cycles = 0;
        let val = this.read8PcInc();

        if (val != 0xCB) {
            t[val](this, val);
        } else {
            // this.gb.info(`Prefix: ${hexN(val, 2)}`);
            val = this.read8PcInc();
            CB_PREFIX_TABLE[val](this, val);
        }

        // this.gb.info(`Addr:${hexN(origPc, 4)} Opcode:${hexN(val, 2)}`);

        return this.cycles;
    }

    setReg(reg: number, val: number) {
        // boundsCheck8(val);

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
                this.writeIndirectHl(val);
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
        return this.read8(this.getHl());
    }

    writeIndirectHl(val: number): void {
        this.write8(this.getHl(), val);
    }


    read8PcInc(): number {
        let val = this.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;
        return val;
    }

    read16PcInc(): number {
        let lower = this.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;
        let upper = this.read8(this.pc);
        this.pc = (this.pc + 1) & 0xFFFF;
        return (upper << 8) | lower;
    }

    push(u16: number) {
        let upper = (u16 >> 8) & 0xFF;
        let lower = (u16 >> 0) & 0xFF;
        this.sp = (this.sp - 1) & 0xFFFF;
        this.write8(this.sp, upper);
        this.sp = (this.sp - 1) & 0xFFFF;
        this.write8(this.sp, lower);
    }

    pop(): number {
        let lower = this.read8(this.sp);
        this.sp = (this.sp + 1) & 0xFFFF;
        let upper = this.read8(this.sp);
        this.sp = (this.sp + 1) & 0xFFFF;

        return (upper << 8) | lower;
    }

    enableInterrupts = function(this: CPU) {
        this.ime = true;
    }.bind(this);
}

type Instruction = (cpu: CPU, opcode: number) => void;

const t: Instruction[] = genUnprefixedTable();
const CB_PREFIX_TABLE: Instruction[] = genCbPrefixTable();

function genUnprefixedTable(): Instruction[] {
    const t: Instruction[] = new Array(256);
    for (let i = 0; i < 256; i++) {
        t[i] = (cpu) => {
            cpu.gb.error(`Unimplemented unprefixed: ${hex(i, 2)}`);
        };
    }

    for (let i = 0; i < 256; i++) {
        if (i >= 0x40 && i <= 0x7F) {
            if (i != 0x76) {
                t[i] = LD_R8_R8;
            }
        }
    }

    t[0x01] = LD_BC_U16; // LD BC, U16
    t[0x11] = LD_DE_U16; // LD DE, U16
    t[0x21] = LD_HL_U16; // LD HL, U16
    t[0x31] = LD_SP_U16; // LD SP, U16
    t[0xFA] = LD_A_iU16;
    t[0xEA] = LD_iU16_A;
    t[0x08] = LD_iU16_SP;
    t[0xC3] = JP; // JP U16
    t[0xC2] = JP_CC; // JP NZ, U16
    t[0xCA] = JP_CC; // JP Z, U16
    t[0xD2] = JP_CC; // JP NC, U16
    t[0xDA] = JP_CC; // JP C, U16
    t[0xCD] = CALL; // CALL U16
    t[0xDC] = CALL_CC; // CALL C, U16
    t[0xD4] = CALL_CC; // CALL NC, U16
    t[0xCC] = CALL_CC; // CALL Z, U16
    t[0xC4] = CALL_CC; // CALL NZ, U16
    t[0xF0] = LD_A_iFF00plusU8;
    t[0xE0] = LD_iFF00plusU8_A;
    t[0x36] = LD_iHL_U8;
    t[0xF8] = LD_HL_SPplusE8;
    t[0xE8] = ADD_SP_E8;
    t[0xE6] = AND_A_U8;
    t[0xF6] = OR_A_U8;  // OR A, U8
    t[0xEE] = XOR_A_U8;  // XOR A, U8
    t[0xFE] = CP_A_U8;  // CP A, U8
    t[0x18] = JR;  // JR E8
    t[0x20] = JR;  // JR NZ, E8
    t[0x28] = JR;  // JR Z, E8
    t[0x30] = JR;  // JR NC, E8
    t[0x38] = JR;  // JR C, E8
    t[0xC6] = ADD_A_U8;  // ADD A, U8
    t[0xCE] = ADC_A_U8;  // ADC A, U8
    t[0xD6] = SUB_A_U8;  // SUB A, U8
    t[0xDE] = SBC_A_U8;  // SBC A, U8
    t[0x06] = LD_R8_U8; // LD B, U8
    t[0x0E] = LD_R8_U8; // LD C, U8
    t[0x16] = LD_R8_U8; // LD D, U8
    t[0x1E] = LD_R8_U8; // LD E, U8
    t[0x26] = LD_R8_U8; // LD H, U8
    t[0x2E] = LD_R8_U8; // LD L, U8
    t[0x36] = LD_R8_U8; // LD (HL), U8
    t[0x3E] = LD_R8_U8; // LD A, U8
    t[0xF9] = LD_SP_HL; // LD SP, HL
    t[0xC5] = PUSH_BC;  // PUSH BC
    t[0xD5] = PUSH_DE;  // PUSH DE
    t[0xE5] = PUSH_HL;  // PUSH HL
    t[0xF5] = PUSH_AF;  // PUSH AF 
    t[0xC1] = POP_BC;  // POP BC
    t[0xD1] = POP_DE;  // POP DE
    t[0xE1] = POP_HL;  // POP HL
    t[0xF1] = POP_AF;  // POP AF 
    t[0x04] = INC_R8;  // INC B
    t[0x0C] = INC_R8;  // INC C
    t[0x14] = INC_R8;  // INC D
    t[0x1C] = INC_R8;  // INC E
    t[0x24] = INC_R8;  // INC H
    t[0x2C] = INC_R8;  // INC L
    t[0x34] = INC_R8;  // INC [HL]
    t[0x3C] = INC_R8;  // INC A
    t[0x05] = DEC_R8;  // DEC B
    t[0x0D] = DEC_R8;  // DEC C
    t[0x15] = DEC_R8;  // DEC D
    t[0x1D] = DEC_R8;  // DEC E
    t[0x25] = DEC_R8;  // DEC H
    t[0x2D] = DEC_R8;  // DEC L
    t[0x35] = DEC_R8;  // DEC [HL]
    t[0x3D] = DEC_R8;  // DEC A
    t[0x03] = INC_BC;  // INC BC
    t[0x13] = INC_DE;  // INC DE 
    t[0x23] = INC_HL;  // INC HL
    t[0x33] = INC_SP;  // INC SP
    t[0x0B] = DEC_BC;  // DEC BC
    t[0x1B] = DEC_DE;  // DEC DE 
    t[0x2B] = DEC_HL;  // DEC HL
    t[0x3B] = DEC_SP;  // DEC SP
    t[0x80] = ADD_A_R8; // ADD A, B
    t[0x81] = ADD_A_R8; // ADD A, C
    t[0x82] = ADD_A_R8; // ADD A, D
    t[0x83] = ADD_A_R8; // ADD A, E
    t[0x84] = ADD_A_R8; // ADD A, H
    t[0x85] = ADD_A_R8; // ADD A, L
    t[0x86] = ADD_A_R8; // ADD A, (HL)
    t[0x87] = ADD_A_R8;  // ADD A, A
    t[0x88] = ADC_A_R8;  // ADC A, B
    t[0x89] = ADC_A_R8;  // ADC A, C
    t[0x8A] = ADC_A_R8;  // ADC A, D
    t[0x8B] = ADC_A_R8;  // ADC A, E
    t[0x8C] = ADC_A_R8;  // ADC A, H
    t[0x8D] = ADC_A_R8;  // ADC A, L
    t[0x8E] = ADC_A_R8;  // ADC A, (HL)
    t[0x8F] = ADC_A_R8;  // ADC A, A
    t[0x90] = SUB_A_R8; // SUB A, B
    t[0x91] = SUB_A_R8;  // SUB A, C
    t[0x92] = SUB_A_R8;  // SUB A, D
    t[0x93] = SUB_A_R8;  // SUB A, E
    t[0x94] = SUB_A_R8;  // SUB A, H
    t[0x95] = SUB_A_R8;  // SUB A, L
    t[0x96] = SUB_A_R8;  // SUB A, (HL)
    t[0x97] = SUB_A_R8;  // SUB A, A
    t[0x98] = SBC_A_R8;  // SBC A, B
    t[0x99] = SBC_A_R8;  // SBC A, C
    t[0x9A] = SBC_A_R8;  // SBC A, D
    t[0x9B] = SBC_A_R8;  // SBC A, E
    t[0x9C] = SBC_A_R8;  // SBC A, H
    t[0x9D] = SBC_A_R8;  // SBC A, L
    t[0x9E] = SBC_A_R8;  // SBC A, (HL)
    t[0x9F] = SBC_A_R8;  // SBC A, A
    t[0xA0] = AND_A_R8;  // AND A, B
    t[0xA1] = AND_A_R8;  // AND A, C
    t[0xA2] = AND_A_R8;  // AND A, D
    t[0xA3] = AND_A_R8;  // AND A, E
    t[0xA4] = AND_A_R8;  // AND A, H
    t[0xA5] = AND_A_R8;  // AND A, L
    t[0xA6] = AND_A_R8;  // AND A, (HL)
    t[0xA7] = AND_A_R8;  // AND A, A
    t[0xA8] = XOR_A_R8; // XOR A, B
    t[0xA9] = XOR_A_R8; // XOR A, C
    t[0xAA] = XOR_A_R8; // XOR A, D
    t[0xAB] = XOR_A_R8; // XOR A, E
    t[0xAC] = XOR_A_R8; // XOR A, H
    t[0xAD] = XOR_A_R8; // XOR A, L
    t[0xAE] = XOR_A_R8; // XOR A, (HL)
    t[0xAF] = XOR_A_R8;  // XOR A, A
    t[0xB0] = OR_A_R8;  // OR A, B
    t[0xB1] = OR_A_R8;  // OR A, C
    t[0xB2] = OR_A_R8;  // OR A, D
    t[0xB3] = OR_A_R8;  // OR A, E
    t[0xB4] = OR_A_R8;  // OR A, H
    t[0xB5] = OR_A_R8;  // OR A, L
    t[0xB6] = OR_A_R8;  // OR A, (HL)
    t[0xB7] = OR_A_R8;  // OR A, A
    t[0xB8] = CP_A_R8;  // CP A, B
    t[0xB9] = CP_A_R8;  // CP A, C
    t[0xBA] = CP_A_R8;  // CP A, D
    t[0xBB] = CP_A_R8;  // CP A, E
    t[0xBC] = CP_A_R8;  // CP A, H
    t[0xBD] = CP_A_R8;  // CP A, L
    t[0xBE] = CP_A_R8;  // CP A, (HL)
    t[0xBF] = CP_A_R8;  // CP A, A
    t[0x2F] = CPL;  // CPL
    t[0xD9] = RETI;  // RETI
    t[0x27] = DAA;  // DAA
    t[0x00] = NOP;  // NOP
    t[0x02] = LD_iBC_A;
    t[0x12] = LD_iDE_A;
    t[0x22] = LD_iHLinc_A;
    t[0x32] = LD_iHLdec_A;
    t[0x0A] = LD_A_iBC;
    t[0x1A] = LD_A_iDE;
    t[0x2A] = LD_A_iHLinc;
    t[0x3A] = LD_A_iHLdec;
    t[0xF2] = LD_A_iFF00plusC;
    t[0xE2] = LD_iFF00plusC_A;
    t[0xF3] = DI;
    t[0xFB] = EI;
    t[0xE9] = JP_HL;
    t[0x07] = RLCA;
    t[0x0F] = RRCA;
    t[0x1F] = RRA;
    t[0x17] = RLA;
    t[0x76] = HALT;
    t[0x37] = SCF;
    t[0x3F] = CCF;
    t[0xC9] = RET;  // RET
    t[0xD8] = RET_CC;  // RET C
    t[0xD0] = RET_CC;  // RET NC
    t[0xC8] = RET_CC;  // RET Z
    t[0xC0] = RET_CC;  // RET NZ
    t[0xC7] = RST;  // RST 00h 
    t[0xCF] = RST;  // RST 08h
    t[0xD7] = RST;  // RST 10h
    t[0xDF] = RST;  // RST 18h
    t[0xE7] = RST;  // RST 20h
    t[0xEF] = RST;  // RST 28h
    t[0xF7] = RST;  // RST 30h
    t[0xFF] = RST;  // RST 38h
    t[0x09] = ADD_HL_BC; // ADD HL, BC
    t[0x19] = ADD_HL_DE; // ADD HL, DE
    t[0x29] = ADD_HL_HL; // ADD HL, HL
    t[0x39] = ADD_HL_SP; // ADD HL, SP

    return t;
}

function genCbPrefixTable(): Instruction[] {
    const t: Instruction[] = new Array(256);
    for (let i = 0; i < 256; i++) {
        switch (i >> 6) {
            case 0b00:
                switch ((i >> 3) & 0b111) {
                    case 0: t[i] = RLC; break;
                    case 1: t[i] = RRC; break;
                    case 2: t[i] = RL; break;
                    case 3: t[i] = RR; break;
                    case 4: t[i] = SLA; break;
                    case 5: t[i] = SRA; break;
                    case 6: t[i] = SWAP; break;
                    case 7: t[i] = SRL; break;
                    default:
                        t[i] = (cpu) => {
                            cpu.gb.error(`Unimplemented CB prefix: ${hex(i, 2)}`);
                        };
                        break;
                }
                break;
            case 0b01:
                t[i] = BIT;
                break;
            case 0b10:
                t[i] = RES;
                break;
            case 0b11:
                t[i] = SET;
                break;
        }
    }

    return t;
}
