import { CPU } from './cpu';
import { unTwo8b } from '../util/misc';
import { bitTest } from '../util/bits';

export function LD_BC_U16(cpu: CPU) {
    cpu.c = cpu.read8PcInc();
    cpu.b = cpu.read8PcInc();
}
export function LD_DE_U16(cpu: CPU) {
    cpu.e = cpu.read8PcInc();
    cpu.d = cpu.read8PcInc();
}
export function LD_HL_U16(cpu: CPU) {
    cpu.l = cpu.read8PcInc();
    cpu.h = cpu.read8PcInc();
}
export function LD_SP_U16(cpu: CPU) {
    let lower = cpu.read8PcInc();
    let upper = cpu.read8PcInc();

    cpu.sp = (upper << 8) | lower;
}

export function ADD_HL_BC(cpu: CPU) {
    let r16Val = cpu.getBc();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tick(4);
}
export function ADD_HL_DE(cpu: CPU) {
    let r16Val = cpu.getDe();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tick(4);
}
export function ADD_HL_HL(cpu: CPU) {
    let r16Val = cpu.getHl();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tick(4);
}
export function ADD_HL_SP(cpu: CPU) {
    let r16Val = cpu.sp;
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tick(4);
}


export function LD_iU16_SP(cpu: CPU) {
    let addr = cpu.read16PcInc();

    let spLower = (cpu.sp >> 0) & 0xFF;
    let spUpper = (cpu.sp >> 8) & 0xFF;

    cpu.write8((addr + 0) & 0xFFFF, spLower);
    cpu.write8((addr + 1) & 0xFFFF, spUpper);
}

export function LD_iBC_A(cpu: CPU) {
    cpu.write8(cpu.getBc(), cpu.a);
}
export function LD_A_iBC(cpu: CPU) {
    cpu.a = cpu.read8(cpu.getBc());
}
export function LD_iDE_A(cpu: CPU) {
    cpu.write8(cpu.getDe(), cpu.a);
}
export function LD_A_iDE(cpu: CPU) {
    cpu.a = cpu.read8(cpu.getDe());
}
export function LD_iHLinc_A(cpu: CPU) {
    cpu.writeIndirectHl(cpu.a);
    cpu.setHl((cpu.getHl() + 1) & 0xFFFF);
}
export function LD_A_iHLinc(cpu: CPU) {
    cpu.a = cpu.readIndirectHl();
    cpu.setHl((cpu.getHl() + 1) & 0xFFFF);
}
export function LD_iHLdec_A(cpu: CPU) {
    cpu.writeIndirectHl(cpu.a);
    cpu.setHl((cpu.getHl() - 1) & 0xFFFF);
}
export function LD_A_iHLdec(cpu: CPU) {
    cpu.a = cpu.readIndirectHl();
    cpu.setHl((cpu.getHl() - 1) & 0xFFFF);
}

export function ADD_A_R8(cpu: CPU, opcode: number) {
    let val = cpu.getReg(opcode & 0b111);

    cpu.a = (cpu.a + val) & 0xFF;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (val & 0xF) > 0xF;
    cpu.carry = (cpu.a + val) > 0xFF;
}

export function ADC_A_R8(cpu: CPU, opcode: number) {
    let val = cpu.getReg(opcode & 0b111);

    cpu.a = (cpu.a + val + (cpu.carry ? 1 : 0)) & 0xFF;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (val & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (cpu.a + val + (cpu.carry ? 1 : 0)) > 0xFF;
}

export function AND_A_R8(cpu: CPU, opcode: number) {
    let val = cpu.getReg(opcode & 0b111);

    cpu.a = cpu.a & val;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;
}

export function SUB_A_R8(cpu: CPU, opcode: number) {
    let val = cpu.getReg(opcode & 0b111);

    cpu.a = (cpu.a - val) & 0xFF;

    cpu.zero = cpu.a == 0;
    cpu.negative = true;
    cpu.halfCarry = (val & 0xF) > (cpu.a & 0xF);
    cpu.carry = val > cpu.a;
}

export function XOR_A_R8(cpu: CPU, opcode: number) {
    cpu.a &= cpu.getReg(opcode & 0b111);

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function OR_A_R8(cpu: CPU, opcode: number) {
    let val = cpu.getReg(opcode & 0b111);

    cpu.a = cpu.a | val;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;
}

export function CP_A_R8(cpu: CPU, opcode: number) {
    let val = cpu.getReg(opcode & 0b111);
    let res = (cpu.a - val) & 0xFF;

    cpu.zero = res == 0;
    cpu.negative = true;
    cpu.halfCarry = (val & 0xF) > (cpu.a & 0xF); // If borrow from bit 4
    cpu.carry = val > cpu.a;
}
export function ADD_A_U8(cpu: CPU, opcode: number) {
    let imm = cpu.read8PcInc();

    cpu.a = (cpu.a + imm) & 0xFF;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (imm & 0xF) > 0xF;
    cpu.carry = (cpu.a + imm) > 0xFF;
}
export function ADC_A_U8(cpu: CPU, opcode: number) {
    let imm = cpu.read8PcInc();

    cpu.a = (cpu.a + imm + (cpu.carry ? 1 : 0)) & 0xFF;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (imm & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (cpu.a + imm + (cpu.carry ? 1 : 0)) > 0xFF;
}

export function SUB_A_U8(cpu: CPU, opcode: number) {
    let imm = cpu.read8PcInc();

    cpu.a = (cpu.a - imm) & 0xFF;

    cpu.zero = cpu.a == 0;
    cpu.negative = true;
    cpu.halfCarry = (imm & 0xF) > (cpu.a & 0xF);
    cpu.carry = imm > cpu.a;
}

export function AND_A_U8(cpu: CPU, opcode: number) {
    let imm = cpu.read8PcInc();

    cpu.a = cpu.a & imm;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;
}

export function XOR_A_U8(cpu: CPU, opcode: number) {
    let imm = cpu.read8PcInc();

    cpu.a = cpu.a ^ imm;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;
}

export function OR_A_U8(cpu: CPU, opcode: number) {
    let imm = cpu.read8PcInc();

    cpu.a = cpu.a | imm;

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;
}

export function CP_A_U8(cpu: CPU) {
    let imm = cpu.read8PcInc();

    let res = (cpu.a - imm) & 0xFF;

    cpu.zero = res == 0;
    cpu.negative = true;
    cpu.halfCarry = (imm & 0xF) > (cpu.a & 0xF); // If borrow from bit 4
    cpu.carry = imm > cpu.a;
}

export function JR(cpu: CPU, opcode: number) {
    let cond = false;
    switch ((opcode >> 3) & 0b111) {
        case 3:
            cond = true;
            break;
        case 4:
            cond = !cpu.zero;
            break;
        case 5:
            cond = cpu.zero;
            break;
        case 6:
            cond = !cpu.carry;
            break;
        case 7:
            cond = cpu.carry;
            break;
    }

    let offset = unTwo8b(cpu.read8PcInc());
    if (cond) {
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    }
}

export function CALL(cpu: CPU, opcode: number) {
    let target = cpu.read16PcInc();
    cpu.push(cpu.pc);
    cpu.pc = target;
}


export function JP(cpu: CPU, opcode: number) {
    let target = cpu.read16PcInc();
    cpu.pc = target;
}

export function RET(cpu: CPU, opcode: number) {
    cpu.pc = cpu.pop();
}

export function RET_CC(cpu: CPU, opcode: number) {
    let cond = false;
    switch ((opcode >> 3) & 0b111) {
        case 0:
            cond = !cpu.zero;
            break;
        case 1:
            cond = cpu.zero;
            break;
        case 2:
            cond = !cpu.carry;
            break;
        case 3:
            cond = cpu.carry;
            break;
    }

    if (cond) {
        cpu.pc = cpu.pop();
    }
}

export function EI(cpu: CPU, opcode: number) {
    cpu.scheduleEi = true;
}
export function DI(cpu: CPU, opcode: number) {
    cpu.ime = false;
}

export function LD_R8_R8(cpu: CPU, opcode: number) {
    cpu.setReg((opcode >> 3) & 0b111, cpu.getReg(opcode & 0b111));
}

export function LD_R8_U8(cpu: CPU, opcode: number) {
    let val = cpu.read8PcInc();
    cpu.setReg((opcode >> 3) & 0b111, val);
}

export function LD_FF00plusC_A(cpu: CPU, opcode: number) {
    cpu.write8(0xFF00 | cpu.c, cpu.a);
}
export function LD_A_FF00plusC(cpu: CPU, opcode: number) {
    cpu.a = cpu.read8(0xFF00 | cpu.c);
}

export function LD_iU16_A(cpu: CPU, opcode: number) {
    cpu.write8(cpu.read16PcInc(), cpu.a);
}
export function LD_A_iU16(cpu: CPU, opcode: number) {
    cpu.a = cpu.read8(cpu.read16PcInc() | cpu.c);
}

export function INC_R8(cpu: CPU, opcode: number) {
    let regId = (opcode >> 3) & 0b111;
    let oldVal = cpu.getReg(regId);
    let newVal = (oldVal + 1) & 0xFF;
    cpu.setReg(regId, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldVal & 0xF) + (1 & 0xF) > 0xF;
}
export function DEC_R8(cpu: CPU, opcode: number) {
    let regId = (opcode >> 3) & 0b111;
    let oldVal = cpu.getReg(regId);
    let newVal = (oldVal - 1) & 0xFF;
    cpu.setReg(regId, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = (1 & 0xF) > (oldVal & 0xF);
}

export function LD_iFF00plusU8_A(cpu: CPU) {
    let u8 = cpu.read8PcInc();
    cpu.write8(0xFF00 | u8, cpu.a);
}
export function LD_A_iFF00plusU8(cpu: CPU) {
    let u8 = cpu.read8PcInc();
    cpu.a = cpu.read8(0xFF00 | u8);
}

export function PUSH_BC(cpu: CPU) {
    cpu.push(cpu.getBc());
}
export function PUSH_DE(cpu: CPU) {
    cpu.push(cpu.getDe());
}
export function PUSH_HL(cpu: CPU) {
    cpu.push(cpu.getHl());
}
export function PUSH_AF(cpu: CPU) {
    cpu.push(cpu.getAf());
}

export function POP_BC(cpu: CPU) {
    cpu.setBc(cpu.pop());
}
export function POP_DE(cpu: CPU) {
    cpu.setDe(cpu.pop());
}
export function POP_HL(cpu: CPU) {
    cpu.setHl(cpu.pop());
}
export function POP_AF(cpu: CPU) {
    cpu.setAf(cpu.pop());
}

export function INC_BC(cpu: CPU) { cpu.setBc((cpu.getBc() + 1) & 0xFFFF); }
export function DEC_BC(cpu: CPU) { cpu.setBc((cpu.getBc() - 1) & 0xFFFF); }
export function INC_DE(cpu: CPU) { cpu.setDe((cpu.getDe() + 1) & 0xFFFF); }
export function DEC_DE(cpu: CPU) { cpu.setDe((cpu.getDe() - 1) & 0xFFFF); }
export function INC_HL(cpu: CPU) { cpu.setHl((cpu.getHl() + 1) & 0xFFFF); }
export function DEC_HL(cpu: CPU) { cpu.setHl((cpu.getHl() - 1) & 0xFFFF); }
export function INC_SP(cpu: CPU) { cpu.sp = (cpu.sp + 1) & 0xFFFF; }
export function DEC_SP(cpu: CPU) { cpu.sp = (cpu.sp - 1) & 0xFFFF; }

export function RLA(cpu: CPU) {
    let oldVal = cpu.a;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let newVal = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.a = newVal;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RRA(cpu: CPU) {
    let oldVal = cpu.a;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let newVal = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.a = newVal;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RLCA(cpu: CPU, opcode: number) {
    let oldVal = cpu.a;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let newVal = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.a = newVal;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RRCA(cpu: CPU, opcode: number) {
    let oldVal = cpu.a;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let newVal = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.a = newVal;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}


export function NOP(cpu: CPU) { }

export function CPL(cpu: CPU) {
    cpu.a = cpu.a ^ 0xFF;
}

export function RST(cpu: CPU, opcode: number) {
    let target = 8 * ((opcode >> 3) & 0b111);
    cpu.push(cpu.pc);
    cpu.pc = target;
}

export function JP_CC(cpu: CPU, opcode: number) {
    let cond = false;

    switch ((opcode >> 3) & 0b111) {
        case 0:
            cond = !cpu.zero;
            break;
        case 1:
            cond = cpu.zero;
            break;
        case 2:
            cond = !cpu.carry;
            break;
        case 3:
            cond = cpu.carry;
            break;
    }

    let target = cpu.read16PcInc();

    if (cond) {
        cpu.push(cpu.pc);
        cpu.pc = target;
    }
}