import { CPU } from "../cpu";
import { unTwo8b } from "../../util/misc";
import { SchedulerId } from "../../scheduler";

/** LD R16, U16 */
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


// LD A, [U16]
export function LD_A_iU16(cpu: CPU, opcode: number): void {
    const u16 = cpu.read16PcInc();

    cpu.a = cpu.read8(u16);
};

// LD [U16], A
export function LD_iU16_A(cpu: CPU, opcode: number): void {
    const u16 = cpu.read16PcInc();

    cpu.write8(u16, cpu.a);
};

export function LD_iU16_SP(cpu: CPU, opcode: number): void {
    const u16 = cpu.read16PcInc();

    const spUpperByte = cpu.sp >> 8;
    const spLowerByte = cpu.sp & 0b11111111;

    cpu.write8(u16 + 0, spLowerByte);
    cpu.write8(u16 + 1, (spUpperByte) & 0xFFFF);

};

export function JP(cpu: CPU, opcode: number): void {
    const u16 = cpu.read16PcInc();
    cpu.pc = u16;

    cpu.tickPending(4); // Branching takes 4 cycles
};

export function JP_NZ(cpu: CPU, opcode: number) {
    if (!cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function JP_Z(cpu: CPU, opcode: number) {
    if (cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

export function JP_NC(cpu: CPU, opcode: number) {
    if (!cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

export function JP_C(cpu: CPU, opcode: number) {
    if (cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

export function CALL(cpu: CPU, opcode: number) {
    let target = cpu.read16PcInc();
    cpu.tickPending(4);
    cpu.push(cpu.pc);
    cpu.pc = target;
}

export function CALL_NZ(cpu: CPU, opcode: number) {
    if (!cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.push(cpu.pc);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function CALL_Z(cpu: CPU, opcode: number) {
    if (cpu.zero) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.push(cpu.pc);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function CALL_NC(cpu: CPU, opcode: number) {
    if (!cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.push(cpu.pc);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}
export function CALL_C(cpu: CPU, opcode: number) {
    if (cpu.carry) {
        let target = cpu.read16PcInc();
        cpu.tickPending(4);
        cpu.push(cpu.pc);
        cpu.pc = target;
    } else {
        cpu.pc = (cpu.pc + 2) & 0xFFFF;
        cpu.tickPending(8);
    }
}

/** LD between A and High RAM */
export function LD_A_iFF00plusU8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    cpu.a = cpu.read8((0xFF00 | imm) & 0xFFFF);

};

export function LD_iFF00plusU8_A(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    cpu.write8((0xFF00 | imm) & 0xFFFF, cpu.a);

};

export function LD_iHL_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    cpu.write8(cpu.getHl(), imm);
};

export function LD_HL_SPplusE8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const signedVal = unTwo8b(imm);

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = (signedVal & 0xF) + (cpu.sp & 0xF) > 0xF;
    cpu.carry = (signedVal & 0xFF) + (cpu.sp & 0xFF) > 0xFF;

    cpu.setHl((unTwo8b(imm) + cpu.sp) & 0xFFFF);

    // Register read timing
    cpu.tickPending(4);
};

export function ADD_SP_E8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const value = unTwo8b(imm);

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = ((value & 0xF) + (cpu.sp & 0xF)) > 0xF;
    cpu.carry = ((value & 0xFF) + (cpu.sp & 0xFF)) > 0xFF;

    cpu.sp = (cpu.sp + value) & 0xFFFF;

    // Extra time
    cpu.tickPending(8);

};

export function AND_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const final = imm & cpu.a;
    cpu.a = final;

    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function OR_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const final = imm | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
};

export function XOR_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const final = imm ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function CP_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const newValue = (cpu.a - imm) & 0xFF;

    // Set flags
    cpu.carry = imm > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (imm & 0xF) < 0;

};

/** JR */

export function JR(cpu: CPU, opcode: number) {
    let offset = unTwo8b(cpu.read8PcInc());
    cpu.tickPending(4);
    cpu.pc = (cpu.pc + offset) & 0xFFFF;
}
export function JR_NZ(cpu: CPU, opcode: number) {
    if (!cpu.zero) {
        let offset = unTwo8b(cpu.read8PcInc());
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}

export function JR_Z(cpu: CPU, opcode: number) {
    if (cpu.zero) {
        let offset = unTwo8b(cpu.read8PcInc());
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}

export function JR_NC(cpu: CPU, opcode: number) {
    if (!cpu.carry) {
        let offset = unTwo8b(cpu.read8PcInc());
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}
export function JR_C(cpu: CPU, opcode: number) {
    if (cpu.carry) {
        let offset = unTwo8b(cpu.read8PcInc());
        cpu.tickPending(4);
        cpu.pc = (cpu.pc + offset) & 0xFFFF;
    } else {
        cpu.pc = (cpu.pc + 1) & 0xFFFF;
        cpu.tickPending(4);
    }
}



/** Arithmetic */
export function ADD_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const newValue = (imm + cpu.a) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (imm & 0xF) > 0xF;
    cpu.carry = (imm + cpu.a) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function ADC_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const newValue = (imm + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (imm & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (imm + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};

export function SUB_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const newValue = (cpu.a - imm) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (imm & 0xF) > (cpu.a & 0xF);
    cpu.carry = imm > cpu.a;

    // Set register values
    cpu.a = newValue;

};

export function SBC_A_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const newValue = (cpu.a - imm - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (imm & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = imm > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};

/** LD R8, U8 */
export function LD_R8_U8(cpu: CPU, opcode: number): void {
    const imm = cpu.read8PcInc();

    const target = (opcode & 0b111000) >> 3;
    cpu.setReg(target, imm);
};

export function LD_SP_HL(cpu: CPU, opcode: number): void {
    cpu.sp = cpu.getHl();
    // Register read timing
    cpu.tickPending(4);

};

export function PUSH_BC(cpu: CPU) {
    cpu.tickPending(4);
    cpu.push(cpu.getBc());
}
export function PUSH_DE(cpu: CPU) {
    cpu.tickPending(4);
    cpu.push(cpu.getDe());
}
export function PUSH_HL(cpu: CPU) {
    cpu.tickPending(4);
    cpu.push(cpu.getHl());
}
export function PUSH_AF(cpu: CPU) {
    cpu.tickPending(4);
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
/** INC R8 */
export function INC_R8(cpu: CPU, opcode: number): void {
    const dest = (opcode & 0b111000) >> 3;

    const oldValue = cpu.getReg(dest);
    const newValue = (oldValue + 1) & 0xFF;
    cpu.setReg(dest, newValue);
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;

};

/** DEC R8 */
export function DEC_R8(cpu: CPU, opcode: number): void {
    const dest = (opcode & 0b111000) >> 3;

    const oldValue = cpu.getReg(dest);
    const newValue = (oldValue - 1) & 0xFF;
    cpu.setReg(dest, newValue);

    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);

};

export function INC_BC(cpu: CPU) { cpu.setBc((cpu.getBc() + 1) & 0xFFFF); cpu.tickPending(4); }
export function DEC_BC(cpu: CPU) { cpu.setBc((cpu.getBc() - 1) & 0xFFFF); cpu.tickPending(4); }
export function INC_DE(cpu: CPU) { cpu.setDe((cpu.getDe() + 1) & 0xFFFF); cpu.tickPending(4); }
export function DEC_DE(cpu: CPU) { cpu.setDe((cpu.getDe() - 1) & 0xFFFF); cpu.tickPending(4); }
export function INC_HL(cpu: CPU) { cpu.setHl((cpu.getHl() + 1) & 0xFFFF); cpu.tickPending(4); }
export function DEC_HL(cpu: CPU) { cpu.setHl((cpu.getHl() - 1) & 0xFFFF); cpu.tickPending(4); }
export function INC_SP(cpu: CPU) { cpu.sp = (cpu.sp + 1) & 0xFFFF; cpu.tickPending(4); }
export function DEC_SP(cpu: CPU) { cpu.sp = (cpu.sp - 1) & 0xFFFF; cpu.tickPending(4); }




export function CPL(cpu: CPU, opcode: number): void {
    cpu.a = cpu.a ^ 0b11111111;

    cpu.negative = true;
    cpu.halfCarry = true;
};

export function RETI(cpu: CPU, opcode: number): void {
    cpu.pc = cpu.pop();
    cpu.tickPending(4); // Branching takes 4 cycles
    cpu.ime = true;
};

export function DAA(cpu: CPU, opcode: number): void {
    if (!cpu.negative) {
        if (cpu.carry || cpu.a > 0x99) {
            cpu.a = (cpu.a + 0x60) & 0xFF;
            cpu.carry = true;
        }
        if (cpu.halfCarry || (cpu.a & 0x0f) > 0x09) {
            cpu.a = (cpu.a + 0x6) & 0xFF;
        }
    }
    else {
        if (cpu.carry) {
            cpu.a = (cpu.a - 0x60) & 0xFF;
            cpu.carry = true;
        }
        if (cpu.halfCarry) {
            cpu.a = (cpu.a - 0x6) & 0xFF;
        }
    }

    cpu.zero = cpu.a === 0;
    cpu.halfCarry = false;
};

export function NOP(): void {
};

/** LD between A and R16 */
export function LD_iBC_A(cpu: CPU, opcode: number): void { // LD [BC], A
    cpu.write8(cpu.getBc(), cpu.a);
};

export function LD_iDE_A(cpu: CPU, opcode: number): void {// LD [DE], A
    cpu.write8(cpu.getDe(), cpu.a);
};
export function LD_iHLinc_A(cpu: CPU, opcode: number): void {// LD [HL+], A
    cpu.write8(cpu.getHl(), cpu.a);
    cpu.setHl((cpu.getHl() + 1) & 0xFFFF);
};
export function LD_iHLdec_A(cpu: CPU, opcode: number): void {  // LD [HL-], A
    cpu.write8(cpu.getHl(), cpu.a);
    cpu.setHl((cpu.getHl() - 1) & 0xFFFF);
};
export function LD_A_iBC(cpu: CPU, opcode: number): void { // LD A, [BC]
    cpu.a = cpu.read8(cpu.getBc());
};
export function LD_A_iDE(cpu: CPU, opcode: number): void { // LD A, [DE]
    cpu.a = cpu.read8(cpu.getDe());
};
export function LD_A_iHLinc(cpu: CPU, opcode: number): void { // LD A, [HL+]
    cpu.a = cpu.read8(cpu.getHl());
    cpu.setHl((cpu.getHl() + 1) & 0xFFFF);
};
export function LD_A_iHLdec(cpu: CPU, opcode: number): void { // LD A, [HL-]
    cpu.a = cpu.read8(cpu.getHl());
    cpu.setHl((cpu.getHl() - 1) & 0xFFFF);
};

export function LD_A_iFF00plusC(cpu: CPU, opcode: number): void { // LD A, [$FF00+C]
    cpu.a = cpu.read8((0xFF00 | cpu.c) & 0xFFFF);
};
export function LD_iFF00plusC_A(cpu: CPU, opcode: number): void {  // LD [$FF00+C], A
    cpu.write8((0xFF00 | cpu.c) & 0xFFFF, cpu.a);
};

export function DI(cpu: CPU, opcode: number): void {  // DI - Disable interrupts master flag
    cpu.ime = false;
};
export function EI(cpu: CPU, opcode: number): void {  // EI - Enable interrupts master flag
    cpu.gb.scheduler.addEventRelative(SchedulerId.EnableInterrupts, 4, cpu.enableInterrupts);
};

/** JP */
export function JP_HL(cpu: CPU, opcode: number): void {  // JP HL
    cpu.pc = cpu.getHl();
};

/** A rotate */
export function RLCA(cpu: CPU, opcode: number): void {    // RLC A
    const value = cpu.a;

    const leftmostBit = (value & 0b10000000) >> 7;

    const newValue = ((value << 1) | leftmostBit) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = (value >> 7) === 1;

};

export function RRCA(cpu: CPU, opcode: number): void {  // RRC A

    const value = cpu.a;

    const rightmostBit = (value & 1) << 7;
    const newValue = ((value >> 1) | rightmostBit) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = (value & 1) === 1;

};

export function RRA(cpu: CPU, opcode: number): void {  // RR A
    const value = cpu.a;

    const newValue = ((value >> 1) | (cpu.carry ? 128 : 0)) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = !!(value & 1);

};
export function RLA(cpu: CPU, opcode: number): void {  // RL A
    const value = cpu.a;

    const newValue = ((value << 1) | (cpu.carry ? 1 : 0)) & 0xFF;

    cpu.a = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = (value >> 7) === 1;

};

export function HALT(cpu: CPU, opcode: number): void {
    if (cpu.ime) {
        cpu.gb.haltSkip();
    } else {
        if ((cpu.ie & cpu.if & 0x1F) == 0) {
            cpu.gb.haltSkip();
        } else {
            cpu.executeHaltBug();
        }
    }
};

/** Carry flag */
export function SCF(cpu: CPU, opcode: number): void { // SCF
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = true;
};

export function CCF(cpu: CPU, opcode: number): void {  // CCF
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = !cpu.carry;
};

/** RET */
export function RET(cpu: CPU, opcode: number): void {
    cpu.pc = cpu.pop();

    cpu.tickPending(4); // Branching takes 4 cycles

};

/** RET */
export function RET_NZ(cpu: CPU, opcode: number) {
    cpu.tickPending(4);
    if (!cpu.zero) {
        cpu.pc = cpu.pop();
        cpu.tickPending(4);
    }
}
export function RET_Z(cpu: CPU, opcode: number) {
    cpu.tickPending(4);
    if (cpu.zero) {
        cpu.pc = cpu.pop();
        cpu.tickPending(4);
    }
}export function RET_NC(cpu: CPU, opcode: number) {
    cpu.tickPending(4);
    if (!cpu.carry) {
        cpu.pc = cpu.pop();
        cpu.tickPending(4);
    }
}export function RET_C(cpu: CPU, opcode: number) {
    cpu.tickPending(4);
    if (cpu.carry) {
        cpu.pc = cpu.pop();
        cpu.tickPending(4);
    }
}


/** Reset Vectors */
export function RST(cpu: CPU, opcode: number): void {
    const target = opcode & 0b111000;

    cpu.tickPending(4);
    cpu.push(cpu.pc);
    cpu.pc = target;

};

export function ADD_HL_BC(cpu: CPU) {
    let r16Val = cpu.getBc();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}
export function ADD_HL_DE(cpu: CPU) {
    let r16Val = cpu.getDe();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}
export function ADD_HL_HL(cpu: CPU) {
    let r16Val = cpu.getHl();
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}
export function ADD_HL_SP(cpu: CPU) {
    let r16Val = cpu.sp;
    let hlVal = cpu.getHl();
    let newVal = hlVal + r16Val;
    cpu.setHl(newVal & 0xFFFF);
    cpu.negative = false;
    cpu.halfCarry = (hlVal & 0xFFF) + (r16Val & 0xFFF) > 0xFFF;
    cpu.carry = newVal > 0xFFFF;

    cpu.tickPending(4);
}