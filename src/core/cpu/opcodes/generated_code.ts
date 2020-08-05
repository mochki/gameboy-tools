import { CPU } from "../cpu";

export function LD_B_B(cpu: CPU, opcode: number): void {
    cpu.b = cpu.b;
};

export function LD_B_C(cpu: CPU, opcode: number): void {
    cpu.b = cpu.c;
};

export function LD_B_D(cpu: CPU, opcode: number): void {
    cpu.b = cpu.d;
};

export function LD_B_E(cpu: CPU, opcode: number): void {
    cpu.b = cpu.e;
};

export function LD_B_H(cpu: CPU, opcode: number): void {
    cpu.b = cpu.h;
};

export function LD_B_L(cpu: CPU, opcode: number): void {
    cpu.b = cpu.l;
};

export function LD_B_iHL(cpu: CPU, opcode: number): void {
    cpu.b = cpu.readIndirectHl();
};

export function LD_B_A(cpu: CPU, opcode: number): void {
    cpu.b = cpu.a;
};

export function LD_C_B(cpu: CPU, opcode: number): void {
    cpu.c = cpu.b;
};

export function LD_C_C(cpu: CPU, opcode: number): void {
    cpu.c = cpu.c;
};

export function LD_C_D(cpu: CPU, opcode: number): void {
    cpu.c = cpu.d;
};

export function LD_C_E(cpu: CPU, opcode: number): void {
    cpu.c = cpu.e;
};

export function LD_C_H(cpu: CPU, opcode: number): void {
    cpu.c = cpu.h;
};

export function LD_C_L(cpu: CPU, opcode: number): void {
    cpu.c = cpu.l;
};

export function LD_C_iHL(cpu: CPU, opcode: number): void {
    cpu.c = cpu.readIndirectHl();
};

export function LD_C_A(cpu: CPU, opcode: number): void {
    cpu.c = cpu.a;
};

export function LD_D_B(cpu: CPU, opcode: number): void {
    cpu.d = cpu.b;
};

export function LD_D_C(cpu: CPU, opcode: number): void {
    cpu.d = cpu.c;
};

export function LD_D_D(cpu: CPU, opcode: number): void {
    cpu.d = cpu.d;
};

export function LD_D_E(cpu: CPU, opcode: number): void {
    cpu.d = cpu.e;
};

export function LD_D_H(cpu: CPU, opcode: number): void {
    cpu.d = cpu.h;
};

export function LD_D_L(cpu: CPU, opcode: number): void {
    cpu.d = cpu.l;
};

export function LD_D_iHL(cpu: CPU, opcode: number): void {
    cpu.d = cpu.readIndirectHl();
};

export function LD_D_A(cpu: CPU, opcode: number): void {
    cpu.d = cpu.a;
};

export function LD_E_B(cpu: CPU, opcode: number): void {
    cpu.e = cpu.b;
};

export function LD_E_C(cpu: CPU, opcode: number): void {
    cpu.e = cpu.c;
};

export function LD_E_D(cpu: CPU, opcode: number): void {
    cpu.e = cpu.d;
};

export function LD_E_E(cpu: CPU, opcode: number): void {
    cpu.e = cpu.e;
};

export function LD_E_H(cpu: CPU, opcode: number): void {
    cpu.e = cpu.h;
};

export function LD_E_L(cpu: CPU, opcode: number): void {
    cpu.e = cpu.l;
};

export function LD_E_iHL(cpu: CPU, opcode: number): void {
    cpu.e = cpu.readIndirectHl();
};

export function LD_E_A(cpu: CPU, opcode: number): void {
    cpu.e = cpu.a;
};

export function LD_H_B(cpu: CPU, opcode: number): void {
    cpu.h = cpu.b;
};

export function LD_H_C(cpu: CPU, opcode: number): void {
    cpu.h = cpu.c;
};

export function LD_H_D(cpu: CPU, opcode: number): void {
    cpu.h = cpu.d;
};

export function LD_H_E(cpu: CPU, opcode: number): void {
    cpu.h = cpu.e;
};

export function LD_H_H(cpu: CPU, opcode: number): void {
    cpu.h = cpu.h;
};

export function LD_H_L(cpu: CPU, opcode: number): void {
    cpu.h = cpu.l;
};

export function LD_H_iHL(cpu: CPU, opcode: number): void {
    cpu.h = cpu.readIndirectHl();
};

export function LD_H_A(cpu: CPU, opcode: number): void {
    cpu.h = cpu.a;
};

export function LD_L_B(cpu: CPU, opcode: number): void {
    cpu.l = cpu.b;
};

export function LD_L_C(cpu: CPU, opcode: number): void {
    cpu.l = cpu.c;
};

export function LD_L_D(cpu: CPU, opcode: number): void {
    cpu.l = cpu.d;
};

export function LD_L_E(cpu: CPU, opcode: number): void {
    cpu.l = cpu.e;
};

export function LD_L_H(cpu: CPU, opcode: number): void {
    cpu.l = cpu.h;
};

export function LD_L_L(cpu: CPU, opcode: number): void {
    cpu.l = cpu.l;
};

export function LD_L_iHL(cpu: CPU, opcode: number): void {
    cpu.l = cpu.readIndirectHl();
};

export function LD_L_A(cpu: CPU, opcode: number): void {
    cpu.l = cpu.a;
};

export function LD_iHL_B(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.b); // = cpu.b;
};

export function LD_iHL_C(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.c); // = cpu.c;
};

export function LD_iHL_D(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.d); // = cpu.d;
};

export function LD_iHL_E(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.e); // = cpu.e;
};

export function LD_iHL_H(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.h); // = cpu.h;
};

export function LD_iHL_L(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.l); // = cpu.l;
};

export function LD_iHL_iHL(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.readIndirectHl()); // = cpu.readIndirectHl();
};

export function LD_iHL_A(cpu: CPU, opcode: number): void {
    cpu.writeIndirectHl(cpu.a); // = cpu.a;
};

export function LD_A_B(cpu: CPU, opcode: number): void {
    cpu.a = cpu.b;
};

export function LD_A_C(cpu: CPU, opcode: number): void {
    cpu.a = cpu.c;
};

export function LD_A_D(cpu: CPU, opcode: number): void {
    cpu.a = cpu.d;
};

export function LD_A_E(cpu: CPU, opcode: number): void {
    cpu.a = cpu.e;
};

export function LD_A_H(cpu: CPU, opcode: number): void {
    cpu.a = cpu.h;
};

export function LD_A_L(cpu: CPU, opcode: number): void {
    cpu.a = cpu.l;
};

export function LD_A_iHL(cpu: CPU, opcode: number): void {
    cpu.a = cpu.readIndirectHl();
};

export function LD_A_A(cpu: CPU, opcode: number): void {
    cpu.a = cpu.a;
};

export function ADD_A_B(cpu: CPU, opcode: number): void {
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

export function ADD_A_C(cpu: CPU, opcode: number): void {
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

export function ADD_A_D(cpu: CPU, opcode: number): void {
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

export function ADD_A_E(cpu: CPU, opcode: number): void {
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

export function ADD_A_H(cpu: CPU, opcode: number): void {
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

export function ADD_A_L(cpu: CPU, opcode: number): void {
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

export function ADD_A_iHL(cpu: CPU, opcode: number): void {
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

export function ADD_A_A(cpu: CPU, opcode: number): void {
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

export function ADC_A_B(cpu: CPU, opcode: number): void {
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

export function ADC_A_C(cpu: CPU, opcode: number): void {
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

export function ADC_A_D(cpu: CPU, opcode: number): void {
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

export function ADC_A_E(cpu: CPU, opcode: number): void {
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

export function ADC_A_H(cpu: CPU, opcode: number): void {
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

export function ADC_A_L(cpu: CPU, opcode: number): void {
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

export function ADC_A_iHL(cpu: CPU, opcode: number): void {
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

export function ADC_A_A(cpu: CPU, opcode: number): void {
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

export function SUB_A_B(cpu: CPU, opcode: number): void {
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

export function SUB_A_C(cpu: CPU, opcode: number): void {
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

export function SUB_A_D(cpu: CPU, opcode: number): void {
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

export function SUB_A_E(cpu: CPU, opcode: number): void {
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

export function SUB_A_H(cpu: CPU, opcode: number): void {
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

export function SUB_A_L(cpu: CPU, opcode: number): void {
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

export function SUB_A_iHL(cpu: CPU, opcode: number): void {
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

export function SUB_A_A(cpu: CPU, opcode: number): void {
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

export function SBC_A_B(cpu: CPU, opcode: number): void {
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

export function SBC_A_C(cpu: CPU, opcode: number): void {
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

export function SBC_A_D(cpu: CPU, opcode: number): void {
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

export function SBC_A_E(cpu: CPU, opcode: number): void {
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

export function SBC_A_H(cpu: CPU, opcode: number): void {
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

export function SBC_A_L(cpu: CPU, opcode: number): void {
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

export function SBC_A_iHL(cpu: CPU, opcode: number): void {
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

export function SBC_A_A(cpu: CPU, opcode: number): void {
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

export function AND_A_B(cpu: CPU, opcode: number): void {
    const value = cpu.b;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_C(cpu: CPU, opcode: number): void {
    const value = cpu.c;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_D(cpu: CPU, opcode: number): void {
    const value = cpu.d;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_E(cpu: CPU, opcode: number): void {
    const value = cpu.e;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_H(cpu: CPU, opcode: number): void {
    const value = cpu.h;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_L(cpu: CPU, opcode: number): void {
    const value = cpu.l;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_iHL(cpu: CPU, opcode: number): void {
    const value = cpu.readIndirectHl();

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function AND_A_A(cpu: CPU, opcode: number): void {
    const value = cpu.a;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};

export function XOR_A_B(cpu: CPU, opcode: number): void {
    const value = cpu.b;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_C(cpu: CPU, opcode: number): void {
    const value = cpu.c;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_D(cpu: CPU, opcode: number): void {
    const value = cpu.d;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_E(cpu: CPU, opcode: number): void {
    const value = cpu.e;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_H(cpu: CPU, opcode: number): void {
    const value = cpu.h;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_L(cpu: CPU, opcode: number): void {
    const value = cpu.l;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_iHL(cpu: CPU, opcode: number): void {
    const value = cpu.readIndirectHl();

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function XOR_A_A(cpu: CPU, opcode: number): void {
    const value = cpu.a;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_B(cpu: CPU, opcode: number): void {
    const value = cpu.b;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_C(cpu: CPU, opcode: number): void {
    const value = cpu.c;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_D(cpu: CPU, opcode: number): void {
    const value = cpu.d;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_E(cpu: CPU, opcode: number): void {
    const value = cpu.e;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_H(cpu: CPU, opcode: number): void {
    const value = cpu.h;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_L(cpu: CPU, opcode: number): void {
    const value = cpu.l;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_iHL(cpu: CPU, opcode: number): void {
    const value = cpu.readIndirectHl();

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function OR_A_A(cpu: CPU, opcode: number): void {
    const value = cpu.a;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};

export function CP_A_B(cpu: CPU, opcode: number): void {
    const B = cpu.b;

    const newValue = (cpu.a - B) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = B > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (B & 0xF) < 0;

};

export function CP_A_C(cpu: CPU, opcode: number): void {
    const C = cpu.c;

    const newValue = (cpu.a - C) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = C > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (C & 0xF) < 0;

};

export function CP_A_D(cpu: CPU, opcode: number): void {
    const D = cpu.d;

    const newValue = (cpu.a - D) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = D > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (D & 0xF) < 0;

};

export function CP_A_E(cpu: CPU, opcode: number): void {
    const E = cpu.e;

    const newValue = (cpu.a - E) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = E > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (E & 0xF) < 0;

};

export function CP_A_H(cpu: CPU, opcode: number): void {
    const H = cpu.h;

    const newValue = (cpu.a - H) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = H > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (H & 0xF) < 0;

};

export function CP_A_L(cpu: CPU, opcode: number): void {
    const L = cpu.l;

    const newValue = (cpu.a - L) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = L > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (L & 0xF) < 0;

};

export function CP_A_iHL(cpu: CPU, opcode: number): void {
    const iHL = cpu.readIndirectHl();

    const newValue = (cpu.a - iHL) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = iHL > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (iHL & 0xF) < 0;

};

export function CP_A_A(cpu: CPU, opcode: number): void {
    const A = cpu.a;

    const newValue = (cpu.a - A) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = A > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (A & 0xF) < 0;

};
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
