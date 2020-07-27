import { CPU } from './cpu';

export function LD_BC_U16(cpu: CPU) {
    cpu.c = cpu.readPcInc();
    cpu.b = cpu.readPcInc();
}
export function LD_DE_U16(cpu: CPU) {
    cpu.e = cpu.readPcInc();
    cpu.d = cpu.readPcInc();
}
export function LD_HL_U16(cpu: CPU) {
    cpu.l = cpu.readPcInc();
    cpu.h = cpu.readPcInc();
}
export function LD_SP_U16(cpu: CPU) {
    let lower = cpu.readPcInc();
    let upper = cpu.readPcInc();

    cpu.sp = (upper << 8) | lower;
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
}