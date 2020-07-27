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

export function XOR_R8_R8(cpu: CPU, opcode: number) {
    cpu.a &= cpu.getReg(opcode & 0b111);

    cpu.zero = cpu.a == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
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

export function RET(cpu: CPU, opcode: number) {
    cpu.pc = cpu.pop();
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

