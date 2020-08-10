import { CPU } from "../cpu";
import { bitTest, bitReset, bitSet } from "../../util/bits";

export function RLC_B(cpu: CPU) {
    let oldVal = cpu.b;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RLC_C(cpu: CPU) {
    let oldVal = cpu.c;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RLC_D(cpu: CPU) {
    let oldVal = cpu.d;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RLC_E(cpu: CPU) {
    let oldVal = cpu.e;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RLC_H(cpu: CPU) {
    let oldVal = cpu.h;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RLC_L(cpu: CPU) {
    let oldVal = cpu.l;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RLC_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RLC_A(cpu: CPU) {
    let oldVal = cpu.a;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
export function RRC_B(cpu: CPU) {
    let oldVal = cpu.b;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RRC_C(cpu: CPU) {
    let oldVal = cpu.c;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RRC_D(cpu: CPU) {
    let oldVal = cpu.d;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RRC_E(cpu: CPU) {
    let oldVal = cpu.e;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RRC_H(cpu: CPU) {
    let oldVal = cpu.h;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RRC_L(cpu: CPU) {
    let oldVal = cpu.l;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RRC_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RRC_A(cpu: CPU) {
    let oldVal = cpu.a;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RL_B(cpu: CPU) {
    let oldVal = cpu.b;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RL_C(cpu: CPU) {
    let oldVal = cpu.c;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RL_D(cpu: CPU) {
    let oldVal = cpu.d;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RL_E(cpu: CPU) {
    let oldVal = cpu.e;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RL_H(cpu: CPU) {
    let oldVal = cpu.h;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RL_L(cpu: CPU) {
    let oldVal = cpu.l;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RL_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RL_A(cpu: CPU) {
    let oldVal = cpu.a;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RR_B(cpu: CPU) {
    let oldVal = cpu.b;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RR_C(cpu: CPU) {
    let oldVal = cpu.c;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RR_D(cpu: CPU) {
    let oldVal = cpu.d;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RR_E(cpu: CPU) {
    let oldVal = cpu.e;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RR_H(cpu: CPU) {
    let oldVal = cpu.h;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RR_L(cpu: CPU) {
    let oldVal = cpu.l;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RR_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RR_A(cpu: CPU) {
    let oldVal = cpu.a;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SLA_B(cpu: CPU) {
    let oldVal = cpu.b;
    let final = (oldVal << 1) & 0xFF;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SLA_C(cpu: CPU) {
    let oldVal = cpu.c;
    let final = (oldVal << 1) & 0xFF;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SLA_D(cpu: CPU) {
    let oldVal = cpu.d;
    let final = (oldVal << 1) & 0xFF;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SLA_E(cpu: CPU) {
    let oldVal = cpu.e;
    let final = (oldVal << 1) & 0xFF;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SLA_H(cpu: CPU) {
    let oldVal = cpu.h;
    let final = (oldVal << 1) & 0xFF;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SLA_L(cpu: CPU) {
    let oldVal = cpu.l;
    let final = (oldVal << 1) & 0xFF;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SLA_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();
    let final = (oldVal << 1) & 0xFF;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SLA_A(cpu: CPU) {
    let oldVal = cpu.a;
    let final = (oldVal << 1) & 0xFF;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SRA_B(cpu: CPU) {
    let oldVal = cpu.b;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRA_C(cpu: CPU) {
    let oldVal = cpu.c;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRA_D(cpu: CPU) {
    let oldVal = cpu.d;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRA_E(cpu: CPU) {
    let oldVal = cpu.e;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRA_H(cpu: CPU) {
    let oldVal = cpu.h;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRA_L(cpu: CPU) {
    let oldVal = cpu.l;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRA_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRA_A(cpu: CPU) {
    let oldVal = cpu.a;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SWAP_B(cpu: CPU) {
    let oldVal = cpu.b;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SWAP_C(cpu: CPU) {
    let oldVal = cpu.c;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SWAP_D(cpu: CPU) {
    let oldVal = cpu.d;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SWAP_E(cpu: CPU) {
    let oldVal = cpu.e;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SWAP_H(cpu: CPU) {
    let oldVal = cpu.h;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SWAP_L(cpu: CPU) {
    let oldVal = cpu.l;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SWAP_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SWAP_A(cpu: CPU) {
    let oldVal = cpu.a;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}

export function SRL_B(cpu: CPU) {
    let oldVal = cpu.b;
    let final = (oldVal >> 1) & 0xFF;

    cpu.b = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRL_C(cpu: CPU) {
    let oldVal = cpu.c;
    let final = (oldVal >> 1) & 0xFF;

    cpu.c = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRL_D(cpu: CPU) {
    let oldVal = cpu.d;
    let final = (oldVal >> 1) & 0xFF;

    cpu.d = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRL_E(cpu: CPU) {
    let oldVal = cpu.e;
    let final = (oldVal >> 1) & 0xFF;

    cpu.e = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRL_H(cpu: CPU) {
    let oldVal = cpu.h;
    let final = (oldVal >> 1) & 0xFF;

    cpu.h = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRL_L(cpu: CPU) {
    let oldVal = cpu.l;
    let final = (oldVal >> 1) & 0xFF;

    cpu.l = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRL_iHL(cpu: CPU) {
    let oldVal = cpu.readIndirectHl();
    let final = (oldVal >> 1) & 0xFF;

    cpu.writeIndirectHl(final); // = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SRL_A(cpu: CPU) {
    let oldVal = cpu.a;
    let final = (oldVal >> 1) & 0xFF;

    cpu.a = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function BIT_B_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_0(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 0);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_B_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_1(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 1);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_B_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_2(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 2);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_B_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_3(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 3);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_B_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_4(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 4);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_B_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_5(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 5);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_B_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_6(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 6);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_B_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.b, 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_C_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.c, 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_D_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.d, 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_E_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.e, 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_H_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.h, 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_L_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.l, 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_iHL_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.readIndirectHl(), 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function BIT_A_7(cpu: CPU) {
    cpu.zero = !bitTest(cpu.a, 7);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function RES_B_0(cpu: CPU) {
    let final = bitReset(cpu.b, 0);
    cpu.b = final;
}

export function RES_C_0(cpu: CPU) {
    let final = bitReset(cpu.c, 0);
    cpu.c = final;
}

export function RES_D_0(cpu: CPU) {
    let final = bitReset(cpu.d, 0);
    cpu.d = final;
}

export function RES_E_0(cpu: CPU) {
    let final = bitReset(cpu.e, 0);
    cpu.e = final;
}

export function RES_H_0(cpu: CPU) {
    let final = bitReset(cpu.h, 0);
    cpu.h = final;
}

export function RES_L_0(cpu: CPU) {
    let final = bitReset(cpu.l, 0);
    cpu.l = final;
}

export function RES_iHL_0(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 0);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_0(cpu: CPU) {
    let final = bitReset(cpu.a, 0);
    cpu.a = final;
}

export function RES_B_1(cpu: CPU) {
    let final = bitReset(cpu.b, 1);
    cpu.b = final;
}

export function RES_C_1(cpu: CPU) {
    let final = bitReset(cpu.c, 1);
    cpu.c = final;
}

export function RES_D_1(cpu: CPU) {
    let final = bitReset(cpu.d, 1);
    cpu.d = final;
}

export function RES_E_1(cpu: CPU) {
    let final = bitReset(cpu.e, 1);
    cpu.e = final;
}

export function RES_H_1(cpu: CPU) {
    let final = bitReset(cpu.h, 1);
    cpu.h = final;
}

export function RES_L_1(cpu: CPU) {
    let final = bitReset(cpu.l, 1);
    cpu.l = final;
}

export function RES_iHL_1(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 1);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_1(cpu: CPU) {
    let final = bitReset(cpu.a, 1);
    cpu.a = final;
}

export function RES_B_2(cpu: CPU) {
    let final = bitReset(cpu.b, 2);
    cpu.b = final;
}

export function RES_C_2(cpu: CPU) {
    let final = bitReset(cpu.c, 2);
    cpu.c = final;
}

export function RES_D_2(cpu: CPU) {
    let final = bitReset(cpu.d, 2);
    cpu.d = final;
}

export function RES_E_2(cpu: CPU) {
    let final = bitReset(cpu.e, 2);
    cpu.e = final;
}

export function RES_H_2(cpu: CPU) {
    let final = bitReset(cpu.h, 2);
    cpu.h = final;
}

export function RES_L_2(cpu: CPU) {
    let final = bitReset(cpu.l, 2);
    cpu.l = final;
}

export function RES_iHL_2(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 2);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_2(cpu: CPU) {
    let final = bitReset(cpu.a, 2);
    cpu.a = final;
}

export function RES_B_3(cpu: CPU) {
    let final = bitReset(cpu.b, 3);
    cpu.b = final;
}

export function RES_C_3(cpu: CPU) {
    let final = bitReset(cpu.c, 3);
    cpu.c = final;
}

export function RES_D_3(cpu: CPU) {
    let final = bitReset(cpu.d, 3);
    cpu.d = final;
}

export function RES_E_3(cpu: CPU) {
    let final = bitReset(cpu.e, 3);
    cpu.e = final;
}

export function RES_H_3(cpu: CPU) {
    let final = bitReset(cpu.h, 3);
    cpu.h = final;
}

export function RES_L_3(cpu: CPU) {
    let final = bitReset(cpu.l, 3);
    cpu.l = final;
}

export function RES_iHL_3(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 3);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_3(cpu: CPU) {
    let final = bitReset(cpu.a, 3);
    cpu.a = final;
}

export function RES_B_4(cpu: CPU) {
    let final = bitReset(cpu.b, 4);
    cpu.b = final;
}

export function RES_C_4(cpu: CPU) {
    let final = bitReset(cpu.c, 4);
    cpu.c = final;
}

export function RES_D_4(cpu: CPU) {
    let final = bitReset(cpu.d, 4);
    cpu.d = final;
}

export function RES_E_4(cpu: CPU) {
    let final = bitReset(cpu.e, 4);
    cpu.e = final;
}

export function RES_H_4(cpu: CPU) {
    let final = bitReset(cpu.h, 4);
    cpu.h = final;
}

export function RES_L_4(cpu: CPU) {
    let final = bitReset(cpu.l, 4);
    cpu.l = final;
}

export function RES_iHL_4(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 4);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_4(cpu: CPU) {
    let final = bitReset(cpu.a, 4);
    cpu.a = final;
}

export function RES_B_5(cpu: CPU) {
    let final = bitReset(cpu.b, 5);
    cpu.b = final;
}

export function RES_C_5(cpu: CPU) {
    let final = bitReset(cpu.c, 5);
    cpu.c = final;
}

export function RES_D_5(cpu: CPU) {
    let final = bitReset(cpu.d, 5);
    cpu.d = final;
}

export function RES_E_5(cpu: CPU) {
    let final = bitReset(cpu.e, 5);
    cpu.e = final;
}

export function RES_H_5(cpu: CPU) {
    let final = bitReset(cpu.h, 5);
    cpu.h = final;
}

export function RES_L_5(cpu: CPU) {
    let final = bitReset(cpu.l, 5);
    cpu.l = final;
}

export function RES_iHL_5(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 5);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_5(cpu: CPU) {
    let final = bitReset(cpu.a, 5);
    cpu.a = final;
}

export function RES_B_6(cpu: CPU) {
    let final = bitReset(cpu.b, 6);
    cpu.b = final;
}

export function RES_C_6(cpu: CPU) {
    let final = bitReset(cpu.c, 6);
    cpu.c = final;
}

export function RES_D_6(cpu: CPU) {
    let final = bitReset(cpu.d, 6);
    cpu.d = final;
}

export function RES_E_6(cpu: CPU) {
    let final = bitReset(cpu.e, 6);
    cpu.e = final;
}

export function RES_H_6(cpu: CPU) {
    let final = bitReset(cpu.h, 6);
    cpu.h = final;
}

export function RES_L_6(cpu: CPU) {
    let final = bitReset(cpu.l, 6);
    cpu.l = final;
}

export function RES_iHL_6(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 6);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_6(cpu: CPU) {
    let final = bitReset(cpu.a, 6);
    cpu.a = final;
}

export function RES_B_7(cpu: CPU) {
    let final = bitReset(cpu.b, 7);
    cpu.b = final;
}

export function RES_C_7(cpu: CPU) {
    let final = bitReset(cpu.c, 7);
    cpu.c = final;
}

export function RES_D_7(cpu: CPU) {
    let final = bitReset(cpu.d, 7);
    cpu.d = final;
}

export function RES_E_7(cpu: CPU) {
    let final = bitReset(cpu.e, 7);
    cpu.e = final;
}

export function RES_H_7(cpu: CPU) {
    let final = bitReset(cpu.h, 7);
    cpu.h = final;
}

export function RES_L_7(cpu: CPU) {
    let final = bitReset(cpu.l, 7);
    cpu.l = final;
}

export function RES_iHL_7(cpu: CPU) {
    let final = bitReset(cpu.readIndirectHl(), 7);
    cpu.writeIndirectHl(final); // = final;
}

export function RES_A_7(cpu: CPU) {
    let final = bitReset(cpu.a, 7);
    cpu.a = final;
}

export function SET_B_0(cpu: CPU) {
    let final = bitSet(cpu.b, 0);
    cpu.b = final;
}

export function SET_C_0(cpu: CPU) {
    let final = bitSet(cpu.c, 0);
    cpu.c = final;
}

export function SET_D_0(cpu: CPU) {
    let final = bitSet(cpu.d, 0);
    cpu.d = final;
}

export function SET_E_0(cpu: CPU) {
    let final = bitSet(cpu.e, 0);
    cpu.e = final;
}

export function SET_H_0(cpu: CPU) {
    let final = bitSet(cpu.h, 0);
    cpu.h = final;
}

export function SET_L_0(cpu: CPU) {
    let final = bitSet(cpu.l, 0);
    cpu.l = final;
}

export function SET_iHL_0(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 0);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_0(cpu: CPU) {
    let final = bitSet(cpu.a, 0);
    cpu.a = final;
}

export function SET_B_1(cpu: CPU) {
    let final = bitSet(cpu.b, 1);
    cpu.b = final;
}

export function SET_C_1(cpu: CPU) {
    let final = bitSet(cpu.c, 1);
    cpu.c = final;
}

export function SET_D_1(cpu: CPU) {
    let final = bitSet(cpu.d, 1);
    cpu.d = final;
}

export function SET_E_1(cpu: CPU) {
    let final = bitSet(cpu.e, 1);
    cpu.e = final;
}

export function SET_H_1(cpu: CPU) {
    let final = bitSet(cpu.h, 1);
    cpu.h = final;
}

export function SET_L_1(cpu: CPU) {
    let final = bitSet(cpu.l, 1);
    cpu.l = final;
}

export function SET_iHL_1(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 1);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_1(cpu: CPU) {
    let final = bitSet(cpu.a, 1);
    cpu.a = final;
}

export function SET_B_2(cpu: CPU) {
    let final = bitSet(cpu.b, 2);
    cpu.b = final;
}

export function SET_C_2(cpu: CPU) {
    let final = bitSet(cpu.c, 2);
    cpu.c = final;
}

export function SET_D_2(cpu: CPU) {
    let final = bitSet(cpu.d, 2);
    cpu.d = final;
}

export function SET_E_2(cpu: CPU) {
    let final = bitSet(cpu.e, 2);
    cpu.e = final;
}

export function SET_H_2(cpu: CPU) {
    let final = bitSet(cpu.h, 2);
    cpu.h = final;
}

export function SET_L_2(cpu: CPU) {
    let final = bitSet(cpu.l, 2);
    cpu.l = final;
}

export function SET_iHL_2(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 2);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_2(cpu: CPU) {
    let final = bitSet(cpu.a, 2);
    cpu.a = final;
}

export function SET_B_3(cpu: CPU) {
    let final = bitSet(cpu.b, 3);
    cpu.b = final;
}

export function SET_C_3(cpu: CPU) {
    let final = bitSet(cpu.c, 3);
    cpu.c = final;
}

export function SET_D_3(cpu: CPU) {
    let final = bitSet(cpu.d, 3);
    cpu.d = final;
}

export function SET_E_3(cpu: CPU) {
    let final = bitSet(cpu.e, 3);
    cpu.e = final;
}

export function SET_H_3(cpu: CPU) {
    let final = bitSet(cpu.h, 3);
    cpu.h = final;
}

export function SET_L_3(cpu: CPU) {
    let final = bitSet(cpu.l, 3);
    cpu.l = final;
}

export function SET_iHL_3(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 3);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_3(cpu: CPU) {
    let final = bitSet(cpu.a, 3);
    cpu.a = final;
}

export function SET_B_4(cpu: CPU) {
    let final = bitSet(cpu.b, 4);
    cpu.b = final;
}

export function SET_C_4(cpu: CPU) {
    let final = bitSet(cpu.c, 4);
    cpu.c = final;
}

export function SET_D_4(cpu: CPU) {
    let final = bitSet(cpu.d, 4);
    cpu.d = final;
}

export function SET_E_4(cpu: CPU) {
    let final = bitSet(cpu.e, 4);
    cpu.e = final;
}

export function SET_H_4(cpu: CPU) {
    let final = bitSet(cpu.h, 4);
    cpu.h = final;
}

export function SET_L_4(cpu: CPU) {
    let final = bitSet(cpu.l, 4);
    cpu.l = final;
}

export function SET_iHL_4(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 4);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_4(cpu: CPU) {
    let final = bitSet(cpu.a, 4);
    cpu.a = final;
}

export function SET_B_5(cpu: CPU) {
    let final = bitSet(cpu.b, 5);
    cpu.b = final;
}

export function SET_C_5(cpu: CPU) {
    let final = bitSet(cpu.c, 5);
    cpu.c = final;
}

export function SET_D_5(cpu: CPU) {
    let final = bitSet(cpu.d, 5);
    cpu.d = final;
}

export function SET_E_5(cpu: CPU) {
    let final = bitSet(cpu.e, 5);
    cpu.e = final;
}

export function SET_H_5(cpu: CPU) {
    let final = bitSet(cpu.h, 5);
    cpu.h = final;
}

export function SET_L_5(cpu: CPU) {
    let final = bitSet(cpu.l, 5);
    cpu.l = final;
}

export function SET_iHL_5(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 5);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_5(cpu: CPU) {
    let final = bitSet(cpu.a, 5);
    cpu.a = final;
}

export function SET_B_6(cpu: CPU) {
    let final = bitSet(cpu.b, 6);
    cpu.b = final;
}

export function SET_C_6(cpu: CPU) {
    let final = bitSet(cpu.c, 6);
    cpu.c = final;
}

export function SET_D_6(cpu: CPU) {
    let final = bitSet(cpu.d, 6);
    cpu.d = final;
}

export function SET_E_6(cpu: CPU) {
    let final = bitSet(cpu.e, 6);
    cpu.e = final;
}

export function SET_H_6(cpu: CPU) {
    let final = bitSet(cpu.h, 6);
    cpu.h = final;
}

export function SET_L_6(cpu: CPU) {
    let final = bitSet(cpu.l, 6);
    cpu.l = final;
}

export function SET_iHL_6(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 6);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_6(cpu: CPU) {
    let final = bitSet(cpu.a, 6);
    cpu.a = final;
}

export function SET_B_7(cpu: CPU) {
    let final = bitSet(cpu.b, 7);
    cpu.b = final;
}

export function SET_C_7(cpu: CPU) {
    let final = bitSet(cpu.c, 7);
    cpu.c = final;
}

export function SET_D_7(cpu: CPU) {
    let final = bitSet(cpu.d, 7);
    cpu.d = final;
}

export function SET_E_7(cpu: CPU) {
    let final = bitSet(cpu.e, 7);
    cpu.e = final;
}

export function SET_H_7(cpu: CPU) {
    let final = bitSet(cpu.h, 7);
    cpu.h = final;
}

export function SET_L_7(cpu: CPU) {
    let final = bitSet(cpu.l, 7);
    cpu.l = final;
}

export function SET_iHL_7(cpu: CPU) {
    let final = bitSet(cpu.readIndirectHl(), 7);
    cpu.writeIndirectHl(final); // = final;
}

export function SET_A_7(cpu: CPU) {
    let final = bitSet(cpu.a, 7);
    cpu.a = final;
}

export function INC_B(cpu: CPU): void {
    const oldValue = cpu.b;
    const newValue = (oldValue + 1) & 0xFF;
    cpu.b = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_B(cpu: CPU): void {
    const oldValue = cpu.b;
    const newValue = (oldValue - 1) & 0xFF;
    cpu.b = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_B_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.b = imm;
};

export function INC_C(cpu: CPU): void {
    const oldValue = cpu.c;
    const newValue = (oldValue + 1) & 0xFF;
    cpu.c = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_C(cpu: CPU): void {
    const oldValue = cpu.c;
    const newValue = (oldValue - 1) & 0xFF;
    cpu.c = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_C_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.c = imm;
};

export function INC_D(cpu: CPU): void {
    const oldValue = cpu.d;
    const newValue = (oldValue + 1) & 0xFF;
    cpu.d = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_D(cpu: CPU): void {
    const oldValue = cpu.d;
    const newValue = (oldValue - 1) & 0xFF;
    cpu.d = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_D_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.d = imm;
};

export function INC_E(cpu: CPU): void {
    const oldValue = cpu.e;
    const newValue = (oldValue + 1) & 0xFF;
    cpu.e = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_E(cpu: CPU): void {
    const oldValue = cpu.e;
    const newValue = (oldValue - 1) & 0xFF;
    cpu.e = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_E_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.e = imm;
};

export function INC_H(cpu: CPU): void {
    const oldValue = cpu.h;
    const newValue = (oldValue + 1) & 0xFF;
    cpu.h = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_H(cpu: CPU): void {
    const oldValue = cpu.h;
    const newValue = (oldValue - 1) & 0xFF;
    cpu.h = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_H_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.h = imm;
};

export function INC_L(cpu: CPU): void {
    const oldValue = cpu.l;
    const newValue = (oldValue + 1) & 0xFF;
    cpu.l = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_L(cpu: CPU): void {
    const oldValue = cpu.l;
    const newValue = (oldValue - 1) & 0xFF;
    cpu.l = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_L_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.l = imm;
};

export function INC_iHL(cpu: CPU): void {
    const oldValue = cpu.readIndirectHl();
    const newValue = (oldValue + 1) & 0xFF;
    cpu.writeIndirectHl(newValue); // = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_iHL(cpu: CPU): void {
    const oldValue = cpu.readIndirectHl();
    const newValue = (oldValue - 1) & 0xFF;
    cpu.writeIndirectHl(newValue); // = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_iHL_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.writeIndirectHl(imm); // = imm;
};

export function INC_A(cpu: CPU): void {
    const oldValue = cpu.a;
    const newValue = (oldValue + 1) & 0xFF;
    cpu.a = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};

export function DEC_A(cpu: CPU): void {
    const oldValue = cpu.a;
    const newValue = (oldValue - 1) & 0xFF;
    cpu.a = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};

export function LD_A_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    cpu.a = imm;
};

export function LD_B_B(cpu: CPU): void {
    cpu.b = cpu.b;
};

export function LD_B_C(cpu: CPU): void {
    cpu.b = cpu.c;
};

export function LD_B_D(cpu: CPU): void {
    cpu.b = cpu.d;
};

export function LD_B_E(cpu: CPU): void {
    cpu.b = cpu.e;
};

export function LD_B_H(cpu: CPU): void {
    cpu.b = cpu.h;
};

export function LD_B_L(cpu: CPU): void {
    cpu.b = cpu.l;
};

export function LD_B_iHL(cpu: CPU): void {
    cpu.b = cpu.readIndirectHl();
};

export function LD_B_A(cpu: CPU): void {
    cpu.b = cpu.a;
};

export function LD_C_B(cpu: CPU): void {
    cpu.c = cpu.b;
};

export function LD_C_C(cpu: CPU): void {
    cpu.c = cpu.c;
};

export function LD_C_D(cpu: CPU): void {
    cpu.c = cpu.d;
};

export function LD_C_E(cpu: CPU): void {
    cpu.c = cpu.e;
};

export function LD_C_H(cpu: CPU): void {
    cpu.c = cpu.h;
};

export function LD_C_L(cpu: CPU): void {
    cpu.c = cpu.l;
};

export function LD_C_iHL(cpu: CPU): void {
    cpu.c = cpu.readIndirectHl();
};

export function LD_C_A(cpu: CPU): void {
    cpu.c = cpu.a;
};

export function LD_D_B(cpu: CPU): void {
    cpu.d = cpu.b;
};

export function LD_D_C(cpu: CPU): void {
    cpu.d = cpu.c;
};

export function LD_D_D(cpu: CPU): void {
    cpu.d = cpu.d;
};

export function LD_D_E(cpu: CPU): void {
    cpu.d = cpu.e;
};

export function LD_D_H(cpu: CPU): void {
    cpu.d = cpu.h;
};

export function LD_D_L(cpu: CPU): void {
    cpu.d = cpu.l;
};

export function LD_D_iHL(cpu: CPU): void {
    cpu.d = cpu.readIndirectHl();
};

export function LD_D_A(cpu: CPU): void {
    cpu.d = cpu.a;
};

export function LD_E_B(cpu: CPU): void {
    cpu.e = cpu.b;
};

export function LD_E_C(cpu: CPU): void {
    cpu.e = cpu.c;
};

export function LD_E_D(cpu: CPU): void {
    cpu.e = cpu.d;
};

export function LD_E_E(cpu: CPU): void {
    cpu.e = cpu.e;
};

export function LD_E_H(cpu: CPU): void {
    cpu.e = cpu.h;
};

export function LD_E_L(cpu: CPU): void {
    cpu.e = cpu.l;
};

export function LD_E_iHL(cpu: CPU): void {
    cpu.e = cpu.readIndirectHl();
};

export function LD_E_A(cpu: CPU): void {
    cpu.e = cpu.a;
};

export function LD_H_B(cpu: CPU): void {
    cpu.h = cpu.b;
};

export function LD_H_C(cpu: CPU): void {
    cpu.h = cpu.c;
};

export function LD_H_D(cpu: CPU): void {
    cpu.h = cpu.d;
};

export function LD_H_E(cpu: CPU): void {
    cpu.h = cpu.e;
};

export function LD_H_H(cpu: CPU): void {
    cpu.h = cpu.h;
};

export function LD_H_L(cpu: CPU): void {
    cpu.h = cpu.l;
};

export function LD_H_iHL(cpu: CPU): void {
    cpu.h = cpu.readIndirectHl();
};

export function LD_H_A(cpu: CPU): void {
    cpu.h = cpu.a;
};

export function LD_L_B(cpu: CPU): void {
    cpu.l = cpu.b;
};

export function LD_L_C(cpu: CPU): void {
    cpu.l = cpu.c;
};

export function LD_L_D(cpu: CPU): void {
    cpu.l = cpu.d;
};

export function LD_L_E(cpu: CPU): void {
    cpu.l = cpu.e;
};

export function LD_L_H(cpu: CPU): void {
    cpu.l = cpu.h;
};

export function LD_L_L(cpu: CPU): void {
    cpu.l = cpu.l;
};

export function LD_L_iHL(cpu: CPU): void {
    cpu.l = cpu.readIndirectHl();
};

export function LD_L_A(cpu: CPU): void {
    cpu.l = cpu.a;
};

export function LD_iHL_B(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.b); // = cpu.b;
};

export function LD_iHL_C(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.c); // = cpu.c;
};

export function LD_iHL_D(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.d); // = cpu.d;
};

export function LD_iHL_E(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.e); // = cpu.e;
};

export function LD_iHL_H(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.h); // = cpu.h;
};

export function LD_iHL_L(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.l); // = cpu.l;
};

export function LD_iHL_iHL(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.readIndirectHl()); // = cpu.readIndirectHl();
};

export function LD_iHL_A(cpu: CPU): void {
    cpu.writeIndirectHl(cpu.a); // = cpu.a;
};

export function LD_A_B(cpu: CPU): void {
    cpu.a = cpu.b;
};

export function LD_A_C(cpu: CPU): void {
    cpu.a = cpu.c;
};

export function LD_A_D(cpu: CPU): void {
    cpu.a = cpu.d;
};

export function LD_A_E(cpu: CPU): void {
    cpu.a = cpu.e;
};

export function LD_A_H(cpu: CPU): void {
    cpu.a = cpu.h;
};

export function LD_A_L(cpu: CPU): void {
    cpu.a = cpu.l;
};

export function LD_A_iHL(cpu: CPU): void {
    cpu.a = cpu.readIndirectHl();
};

export function LD_A_A(cpu: CPU): void {
    cpu.a = cpu.a;
};

export function ADD_A_B(cpu: CPU): void {
    const value = cpu.b;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADD_A_C(cpu: CPU): void {
    const value = cpu.c;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADD_A_D(cpu: CPU): void {
    const value = cpu.d;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADD_A_E(cpu: CPU): void {
    const value = cpu.e;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADD_A_H(cpu: CPU): void {
    const value = cpu.h;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADD_A_L(cpu: CPU): void {
    const value = cpu.l;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADD_A_iHL(cpu: CPU): void {
    const value = cpu.readIndirectHl();

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADD_A_A(cpu: CPU): void {
    const value = cpu.a;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_B(cpu: CPU): void {
    const value = cpu.b;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_C(cpu: CPU): void {
    const value = cpu.c;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_D(cpu: CPU): void {
    const value = cpu.d;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_E(cpu: CPU): void {
    const value = cpu.e;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_H(cpu: CPU): void {
    const value = cpu.h;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_L(cpu: CPU): void {
    const value = cpu.l;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_iHL(cpu: CPU): void {
    const value = cpu.readIndirectHl();

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_A(cpu: CPU): void {
    const value = cpu.a;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_B(cpu: CPU): void {
    const value = cpu.b;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_C(cpu: CPU): void {
    const value = cpu.c;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_D(cpu: CPU): void {
    const value = cpu.d;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_E(cpu: CPU): void {
    const value = cpu.e;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_H(cpu: CPU): void {
    const value = cpu.h;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_L(cpu: CPU): void {
    const value = cpu.l;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_iHL(cpu: CPU): void {
    const value = cpu.readIndirectHl();

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_A(cpu: CPU): void {
    const value = cpu.a;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_B(cpu: CPU): void {
    const value = cpu.b;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_C(cpu: CPU): void {
    const value = cpu.c;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_D(cpu: CPU): void {
    const value = cpu.d;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_E(cpu: CPU): void {
    const value = cpu.e;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_H(cpu: CPU): void {
    const value = cpu.h;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_L(cpu: CPU): void {
    const value = cpu.l;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_iHL(cpu: CPU): void {
    const value = cpu.readIndirectHl();

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_A(cpu: CPU): void {
    const value = cpu.a;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

export function AND_A_B(cpu: CPU): void {
    const value = cpu.b;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_C(cpu: CPU): void {
    const value = cpu.c;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_D(cpu: CPU): void {
    const value = cpu.d;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_E(cpu: CPU): void {
    const value = cpu.e;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_H(cpu: CPU): void {
    const value = cpu.h;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_L(cpu: CPU): void {
    const value = cpu.l;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_iHL(cpu: CPU): void {
    const value = cpu.readIndirectHl();

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_A(cpu: CPU): void {
    const value = cpu.a;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function XOR_A_B(cpu: CPU): void {
    const value = cpu.b;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_C(cpu: CPU): void {
    const value = cpu.c;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_D(cpu: CPU): void {
    const value = cpu.d;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_E(cpu: CPU): void {
    const value = cpu.e;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_H(cpu: CPU): void {
    const value = cpu.h;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_L(cpu: CPU): void {
    const value = cpu.l;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_iHL(cpu: CPU): void {
    const value = cpu.readIndirectHl();

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_A(cpu: CPU): void {
    const value = cpu.a;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_B(cpu: CPU): void {
    const value = cpu.b;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_C(cpu: CPU): void {
    const value = cpu.c;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_D(cpu: CPU): void {
    const value = cpu.d;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_E(cpu: CPU): void {
    const value = cpu.e;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_H(cpu: CPU): void {
    const value = cpu.h;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_L(cpu: CPU): void {
    const value = cpu.l;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_iHL(cpu: CPU): void {
    const value = cpu.readIndirectHl();

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_A(cpu: CPU): void {
    const value = cpu.a;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function CP_A_B(cpu: CPU): void {
    const B = cpu.b;

    const newValue = (cpu.a - B) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = B > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (B & 0xF) < 0;

};

export function CP_A_C(cpu: CPU): void {
    const C = cpu.c;

    const newValue = (cpu.a - C) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = C > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (C & 0xF) < 0;

};

export function CP_A_D(cpu: CPU): void {
    const D = cpu.d;

    const newValue = (cpu.a - D) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = D > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (D & 0xF) < 0;

};

export function CP_A_E(cpu: CPU): void {
    const E = cpu.e;

    const newValue = (cpu.a - E) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = E > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (E & 0xF) < 0;

};

export function CP_A_H(cpu: CPU): void {
    const H = cpu.h;

    const newValue = (cpu.a - H) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = H > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (H & 0xF) < 0;

};

export function CP_A_L(cpu: CPU): void {
    const L = cpu.l;

    const newValue = (cpu.a - L) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = L > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (L & 0xF) < 0;

};

export function CP_A_iHL(cpu: CPU): void {
    const iHL = cpu.readIndirectHl();

    const newValue = (cpu.a - iHL) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = iHL > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (iHL & 0xF) < 0;

};

export function CP_A_A(cpu: CPU): void {
    const A = cpu.a;

    const newValue = (cpu.a - A) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = A > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (A & 0xF) < 0;

};

export function RST_0(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 0;
};

export function RST_8(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 8;
};

export function RST_16(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 16;
};

export function RST_24(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 24;
};

export function RST_32(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 32;
};

export function RST_40(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 40;
};

export function RST_48(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 48;
};

export function RST_56(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = 56;
};
//cb_table[0x00] = RLC_B
//cb_table[0x01] = RLC_C
//cb_table[0x02] = RLC_D
//cb_table[0x03] = RLC_E
//cb_table[0x04] = RLC_H
//cb_table[0x05] = RLC_L
//cb_table[0x06] = RLC_iHL
//cb_table[0x07] = RLC_A
//cb_table[0x08] = RRC_B
//cb_table[0x09] = RRC_C
//cb_table[0x0A] = RRC_D
//cb_table[0x0B] = RRC_E
//cb_table[0x0C] = RRC_H
//cb_table[0x0D] = RRC_L
//cb_table[0x0E] = RRC_iHL
//cb_table[0x0F] = RRC_A
//cb_table[0x10] = RL_B
//cb_table[0x11] = RL_C
//cb_table[0x12] = RL_D
//cb_table[0x13] = RL_E
//cb_table[0x14] = RL_H
//cb_table[0x15] = RL_L
//cb_table[0x16] = RL_iHL
//cb_table[0x17] = RL_A
//cb_table[0x18] = RR_B
//cb_table[0x19] = RR_C
//cb_table[0x1A] = RR_D
//cb_table[0x1B] = RR_E
//cb_table[0x1C] = RR_H
//cb_table[0x1D] = RR_L
//cb_table[0x1E] = RR_iHL
//cb_table[0x1F] = RR_A
//cb_table[0x20] = SLA_B
//cb_table[0x21] = SLA_C
//cb_table[0x22] = SLA_D
//cb_table[0x23] = SLA_E
//cb_table[0x24] = SLA_H
//cb_table[0x25] = SLA_L
//cb_table[0x26] = SLA_iHL
//cb_table[0x27] = SLA_A
//cb_table[0x28] = SRA_B
//cb_table[0x29] = SRA_C
//cb_table[0x2A] = SRA_D
//cb_table[0x2B] = SRA_E
//cb_table[0x2C] = SRA_H
//cb_table[0x2D] = SRA_L
//cb_table[0x2E] = SRA_iHL
//cb_table[0x2F] = SRA_A
//cb_table[0x30] = SWAP_B
//cb_table[0x31] = SWAP_C
//cb_table[0x32] = SWAP_D
//cb_table[0x33] = SWAP_E
//cb_table[0x34] = SWAP_H
//cb_table[0x35] = SWAP_L
//cb_table[0x36] = SWAP_iHL
//cb_table[0x37] = SWAP_A
//cb_table[0x38] = SRL_B
//cb_table[0x39] = SRL_C
//cb_table[0x3A] = SRL_D
//cb_table[0x3B] = SRL_E
//cb_table[0x3C] = SRL_H
//cb_table[0x3D] = SRL_L
//cb_table[0x3E] = SRL_iHL
//cb_table[0x3F] = SRL_A
//cb_table[0x40] = BIT_B_0
//cb_table[0x41] = BIT_C_0
//cb_table[0x42] = BIT_D_0
//cb_table[0x43] = BIT_E_0
//cb_table[0x44] = BIT_H_0
//cb_table[0x45] = BIT_L_0
//cb_table[0x46] = BIT_iHL_0
//cb_table[0x47] = BIT_A_0
//cb_table[0x48] = BIT_B_1
//cb_table[0x49] = BIT_C_1
//cb_table[0x4A] = BIT_D_1
//cb_table[0x4B] = BIT_E_1
//cb_table[0x4C] = BIT_H_1
//cb_table[0x4D] = BIT_L_1
//cb_table[0x4E] = BIT_iHL_1
//cb_table[0x4F] = BIT_A_1
//cb_table[0x50] = BIT_B_2
//cb_table[0x51] = BIT_C_2
//cb_table[0x52] = BIT_D_2
//cb_table[0x53] = BIT_E_2
//cb_table[0x54] = BIT_H_2
//cb_table[0x55] = BIT_L_2
//cb_table[0x56] = BIT_iHL_2
//cb_table[0x57] = BIT_A_2
//cb_table[0x58] = BIT_B_3
//cb_table[0x59] = BIT_C_3
//cb_table[0x5A] = BIT_D_3
//cb_table[0x5B] = BIT_E_3
//cb_table[0x5C] = BIT_H_3
//cb_table[0x5D] = BIT_L_3
//cb_table[0x5E] = BIT_iHL_3
//cb_table[0x5F] = BIT_A_3
//cb_table[0x60] = BIT_B_4
//cb_table[0x61] = BIT_C_4
//cb_table[0x62] = BIT_D_4
//cb_table[0x63] = BIT_E_4
//cb_table[0x64] = BIT_H_4
//cb_table[0x65] = BIT_L_4
//cb_table[0x66] = BIT_iHL_4
//cb_table[0x67] = BIT_A_4
//cb_table[0x68] = BIT_B_5
//cb_table[0x69] = BIT_C_5
//cb_table[0x6A] = BIT_D_5
//cb_table[0x6B] = BIT_E_5
//cb_table[0x6C] = BIT_H_5
//cb_table[0x6D] = BIT_L_5
//cb_table[0x6E] = BIT_iHL_5
//cb_table[0x6F] = BIT_A_5
//cb_table[0x70] = BIT_B_6
//cb_table[0x71] = BIT_C_6
//cb_table[0x72] = BIT_D_6
//cb_table[0x73] = BIT_E_6
//cb_table[0x74] = BIT_H_6
//cb_table[0x75] = BIT_L_6
//cb_table[0x76] = BIT_iHL_6
//cb_table[0x77] = BIT_A_6
//cb_table[0x78] = BIT_B_7
//cb_table[0x79] = BIT_C_7
//cb_table[0x7A] = BIT_D_7
//cb_table[0x7B] = BIT_E_7
//cb_table[0x7C] = BIT_H_7
//cb_table[0x7D] = BIT_L_7
//cb_table[0x7E] = BIT_iHL_7
//cb_table[0x7F] = BIT_A_7
//cb_table[0x80] = RES_B_0
//cb_table[0x81] = RES_C_0
//cb_table[0x82] = RES_D_0
//cb_table[0x83] = RES_E_0
//cb_table[0x84] = RES_H_0
//cb_table[0x85] = RES_L_0
//cb_table[0x86] = RES_iHL_0
//cb_table[0x87] = RES_A_0
//cb_table[0x88] = RES_B_1
//cb_table[0x89] = RES_C_1
//cb_table[0x8A] = RES_D_1
//cb_table[0x8B] = RES_E_1
//cb_table[0x8C] = RES_H_1
//cb_table[0x8D] = RES_L_1
//cb_table[0x8E] = RES_iHL_1
//cb_table[0x8F] = RES_A_1
//cb_table[0x90] = RES_B_2
//cb_table[0x91] = RES_C_2
//cb_table[0x92] = RES_D_2
//cb_table[0x93] = RES_E_2
//cb_table[0x94] = RES_H_2
//cb_table[0x95] = RES_L_2
//cb_table[0x96] = RES_iHL_2
//cb_table[0x97] = RES_A_2
//cb_table[0x98] = RES_B_3
//cb_table[0x99] = RES_C_3
//cb_table[0x9A] = RES_D_3
//cb_table[0x9B] = RES_E_3
//cb_table[0x9C] = RES_H_3
//cb_table[0x9D] = RES_L_3
//cb_table[0x9E] = RES_iHL_3
//cb_table[0x9F] = RES_A_3
//cb_table[0xA0] = RES_B_4
//cb_table[0xA1] = RES_C_4
//cb_table[0xA2] = RES_D_4
//cb_table[0xA3] = RES_E_4
//cb_table[0xA4] = RES_H_4
//cb_table[0xA5] = RES_L_4
//cb_table[0xA6] = RES_iHL_4
//cb_table[0xA7] = RES_A_4
//cb_table[0xA8] = RES_B_5
//cb_table[0xA9] = RES_C_5
//cb_table[0xAA] = RES_D_5
//cb_table[0xAB] = RES_E_5
//cb_table[0xAC] = RES_H_5
//cb_table[0xAD] = RES_L_5
//cb_table[0xAE] = RES_iHL_5
//cb_table[0xAF] = RES_A_5
//cb_table[0xB0] = RES_B_6
//cb_table[0xB1] = RES_C_6
//cb_table[0xB2] = RES_D_6
//cb_table[0xB3] = RES_E_6
//cb_table[0xB4] = RES_H_6
//cb_table[0xB5] = RES_L_6
//cb_table[0xB6] = RES_iHL_6
//cb_table[0xB7] = RES_A_6
//cb_table[0xB8] = RES_B_7
//cb_table[0xB9] = RES_C_7
//cb_table[0xBA] = RES_D_7
//cb_table[0xBB] = RES_E_7
//cb_table[0xBC] = RES_H_7
//cb_table[0xBD] = RES_L_7
//cb_table[0xBE] = RES_iHL_7
//cb_table[0xBF] = RES_A_7
//cb_table[0xC0] = SET_B_0
//cb_table[0xC1] = SET_C_0
//cb_table[0xC2] = SET_D_0
//cb_table[0xC3] = SET_E_0
//cb_table[0xC4] = SET_H_0
//cb_table[0xC5] = SET_L_0
//cb_table[0xC6] = SET_iHL_0
//cb_table[0xC7] = SET_A_0
//cb_table[0xC8] = SET_B_1
//cb_table[0xC9] = SET_C_1
//cb_table[0xCA] = SET_D_1
//cb_table[0xCB] = SET_E_1
//cb_table[0xCC] = SET_H_1
//cb_table[0xCD] = SET_L_1
//cb_table[0xCE] = SET_iHL_1
//cb_table[0xCF] = SET_A_1
//cb_table[0xD0] = SET_B_2
//cb_table[0xD1] = SET_C_2
//cb_table[0xD2] = SET_D_2
//cb_table[0xD3] = SET_E_2
//cb_table[0xD4] = SET_H_2
//cb_table[0xD5] = SET_L_2
//cb_table[0xD6] = SET_iHL_2
//cb_table[0xD7] = SET_A_2
//cb_table[0xD8] = SET_B_3
//cb_table[0xD9] = SET_C_3
//cb_table[0xDA] = SET_D_3
//cb_table[0xDB] = SET_E_3
//cb_table[0xDC] = SET_H_3
//cb_table[0xDD] = SET_L_3
//cb_table[0xDE] = SET_iHL_3
//cb_table[0xDF] = SET_A_3
//cb_table[0xE0] = SET_B_4
//cb_table[0xE1] = SET_C_4
//cb_table[0xE2] = SET_D_4
//cb_table[0xE3] = SET_E_4
//cb_table[0xE4] = SET_H_4
//cb_table[0xE5] = SET_L_4
//cb_table[0xE6] = SET_iHL_4
//cb_table[0xE7] = SET_A_4
//cb_table[0xE8] = SET_B_5
//cb_table[0xE9] = SET_C_5
//cb_table[0xEA] = SET_D_5
//cb_table[0xEB] = SET_E_5
//cb_table[0xEC] = SET_H_5
//cb_table[0xED] = SET_L_5
//cb_table[0xEE] = SET_iHL_5
//cb_table[0xEF] = SET_A_5
//cb_table[0xF0] = SET_B_6
//cb_table[0xF1] = SET_C_6
//cb_table[0xF2] = SET_D_6
//cb_table[0xF3] = SET_E_6
//cb_table[0xF4] = SET_H_6
//cb_table[0xF5] = SET_L_6
//cb_table[0xF6] = SET_iHL_6
//cb_table[0xF7] = SET_A_6
//cb_table[0xF8] = SET_B_7
//cb_table[0xF9] = SET_C_7
//cb_table[0xFA] = SET_D_7
//cb_table[0xFB] = SET_E_7
//cb_table[0xFC] = SET_H_7
//cb_table[0xFD] = SET_L_7
//cb_table[0xFE] = SET_iHL_7
//cb_table[0xFF] = SET_A_7
//table[0x40] = LD_B_B;
//table[0x41] = LD_B_C;
//table[0x42] = LD_B_D;
//table[0x43] = LD_B_E;
//table[0x44] = LD_B_H;
//table[0x45] = LD_B_L;
//table[0x46] = LD_B_iHL;
//table[0x47] = LD_B_A;
//table[0x48] = LD_C_B;
//table[0x49] = LD_C_C;
//table[0x4A] = LD_C_D;
//table[0x4B] = LD_C_E;
//table[0x4C] = LD_C_H;
//table[0x4D] = LD_C_L;
//table[0x4E] = LD_C_iHL;
//table[0x4F] = LD_C_A;
//table[0x50] = LD_D_B;
//table[0x51] = LD_D_C;
//table[0x52] = LD_D_D;
//table[0x53] = LD_D_E;
//table[0x54] = LD_D_H;
//table[0x55] = LD_D_L;
//table[0x56] = LD_D_iHL;
//table[0x57] = LD_D_A;
//table[0x58] = LD_E_B;
//table[0x59] = LD_E_C;
//table[0x5A] = LD_E_D;
//table[0x5B] = LD_E_E;
//table[0x5C] = LD_E_H;
//table[0x5D] = LD_E_L;
//table[0x5E] = LD_E_iHL;
//table[0x5F] = LD_E_A;
//table[0x60] = LD_H_B;
//table[0x61] = LD_H_C;
//table[0x62] = LD_H_D;
//table[0x63] = LD_H_E;
//table[0x64] = LD_H_H;
//table[0x65] = LD_H_L;
//table[0x66] = LD_H_iHL;
//table[0x67] = LD_H_A;
//table[0x68] = LD_L_B;
//table[0x69] = LD_L_C;
//table[0x6A] = LD_L_D;
//table[0x6B] = LD_L_E;
//table[0x6C] = LD_L_H;
//table[0x6D] = LD_L_L;
//table[0x6E] = LD_L_iHL;
//table[0x6F] = LD_L_A;
//table[0x70] = LD_iHL_B;
//table[0x71] = LD_iHL_C;
//table[0x72] = LD_iHL_D;
//table[0x73] = LD_iHL_E;
//table[0x74] = LD_iHL_H;
//table[0x75] = LD_iHL_L;
//table[0x76] = LD_iHL_iHL;
//table[0x77] = LD_iHL_A;
//table[0x78] = LD_A_B;
//table[0x79] = LD_A_C;
//table[0x7A] = LD_A_D;
//table[0x7B] = LD_A_E;
//table[0x7C] = LD_A_H;
//table[0x7D] = LD_A_L;
//table[0x7E] = LD_A_iHL;
//table[0x7F] = LD_A_A;
