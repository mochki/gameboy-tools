// @ts-check
// #region Accumulator Arithmetic

const fs = require('fs');

const ADD_A_R8 = `
export function ADD_A_<regsrc>(cpu: CPU): void {
    const value = <regsrc_get>;

    const newValue = (value + cpu.a) & 0xFF;

    // Set flags
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu.a) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu.a = newValue;

};
`;

const ADC_A_R8 = `
export function ADC_A_<regsrc>(cpu: CPU): void {
    const value = <regsrc_get>;

    const newValue = (value + cpu.a + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.halfCarry = (cpu.a & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu.a + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu.a = newValue;

};
`;

const SUB_A_R8 = `
export function SUB_A_<regsrc>(cpu: CPU): void {
    const value = <regsrc_get>;

    const newValue = (cpu.a - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF);
    cpu.carry = value > cpu.a;

    // Set register values
    cpu.a = newValue;

};
`;

const SBC_A_R8 = `
export function SBC_A_<regsrc>(cpu: CPU): void {
    const value = <regsrc_get>;

    const newValue = (cpu.a - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (value & 0xF) > (cpu.a & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu.a - (cpu.carry ? 1 : 0);

    // Set register values
    cpu.a = newValue;

};
`;

const AND_A_R8 = `
export function AND_A_<regsrc>(cpu: CPU): void {
    const value = <regsrc_get>;

    const final = value & cpu.a;
    cpu.a = final;

    // Set flags
    cpu.zero = cpu.a === 0;
    cpu.negative = false;
    cpu.halfCarry = true;
    cpu.carry = false;

};
`;

const XOR_A_R8 = `
export function XOR_A_<regsrc>(cpu: CPU): void {
    const value = <regsrc_get>;

    const final = value ^ cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};
`;

const OR_A_R8 = `
export function OR_A_<regsrc>(cpu: CPU): void {
    const value = <regsrc_get>;

    const final = value | cpu.a;
    cpu.a = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;

};
`;

const CP_A_R8 = `
export function CP_A_<regsrc>(cpu: CPU): void {
    const <regsrc> = <regsrc_get>;

    const newValue = (cpu.a - <regsrc>) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = <regsrc> > cpu.a;
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.halfCarry = (cpu.a & 0xF) - (<regsrc> & 0xF) < 0;

};
`;

const LD_R8_R8 = `
export function LD_<regdest>_<regsrc>(cpu: CPU): void {
    <regdest_set> = <regsrc_get>;
};
`;

const INC_R8 = `
export function INC_<regdest>(cpu: CPU): void {
    const oldValue = <regsrc_get>;
    const newValue = (oldValue + 1) & 0xFF;
    <regdest_set> = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = false;
    cpu.halfCarry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
};
`;

const DEC_R8 = `
export function DEC_<regdest>(cpu: CPU): void {
    const oldValue = <regsrc_get>;
    const newValue = (oldValue - 1) & 0xFF;
    <regdest_set> = newValue;

    cpu.zero = newValue == 0;
    cpu.negative = true;
    cpu.halfCarry = (1 & 0xF) > (oldValue & 0xF);
};
`;

const LD_R8_U8 = `
export function LD_<regdest>_U8(cpu: CPU): void {
    const imm = cpu.read8(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xFFFF;
    <regdest_set> = imm;
};
`;

const RST = `
export function RST_<vector>(cpu: CPU): void {
    cpu.tickPending(4);
    // <inline_push cpu.pc>
    let pushVal = cpu.pc;
    let upper = (pushVal >> 8) & 0xFF;
    let lower = (pushVal >> 0) & 0xFF;
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, upper);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write8(cpu.sp, lower);
    cpu.pc = <vector>;
};
`;

const RLC = `
export function RLC_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}`;

const RRC = `
export function RRC_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;
    let rotateBit = (oldVal & 0b00000001) << 7;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}
`;

const RL = `
export function RL_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let final = ((oldVal << 1) & 0xFF) | rotateBit;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
`;

const RR = `
export function RR_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let final = ((oldVal >> 1) & 0xFF) | rotateBit;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}
`;

const SLA = `
export function SLA_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;
    let final = (oldVal << 1) & 0xFF;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}
`;

const SRA = `
export function SRA_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;
    let leftmostBit = oldVal & 0b10000000;
    let final = ((oldVal >> 1) & 0xFF) | leftmostBit;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}
`;

const SWAP = `
export function SWAP_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let final = (lower << 4) | upper;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false;
}
`;

const SRL = `
export function SRL_<regsrc>(cpu: CPU) {
    let oldVal = <regsrc_get>;
    let final = (oldVal >> 1) & 0xFF;

    <regdest_set> = final;

    cpu.zero = final == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}
`;

const BIT = `
export function BIT_<regsrc>_<bit_index>(cpu: CPU) {
    cpu.zero = !bitTest(<regsrc_get>, <bit_index>);
    cpu.negative = false;
    cpu.halfCarry = true;
}
`;

const RES = `
export function RES_<regsrc>_<bit_index>(cpu: CPU) {
    let final = bitReset(<regsrc_get>, <bit_index>);
    <regdest_set> = final;
}
`;

const SET = `
export function SET_<regsrc>_<bit_index>(cpu: CPU) {
    let final = bitSet(<regsrc_get>, <bit_index>);
    <regdest_set> = final;
}
`;

let code = "";
let appendix = "";

let regArr = ["B", "C", "D", "E", "H", "L", "iHL", "A"];
let regSrcGetArr = ["cpu.b", "cpu.c", "cpu.d", "cpu.e", "cpu.h", "cpu.l", "cpu.readIndirectHl()", "cpu.a"];
let regDestSetArr = ["cpu.b", "cpu.c", "cpu.d", "cpu.e", "cpu.h", "cpu.l", `cpu.writeIndirectHl()`, "cpu.a"];

/**
 * 
 * @param {string} srcString 
 * @param {string} regSrc 
 * @param {string} regSrcGet 
 * @returns {string}
 * 
 */
function alu_replace(srcString, regSrc, regSrcGet) {
    // I love the JavaScript "standard library." I have to split and join 
    // strings together instead of using a replace-all function that the language doesn't provide.
    srcString = srcString.split("<regsrc>").join(regSrc);
    srcString = srcString.split("<regsrc_get>").join(regSrcGet);
    return srcString;
}

/**
 * 
 * @param {number} regSrcId 
 * @param {number} regDestId 
 */
function ld_r_r_replace(opcode, regDestId, regSrcId) {
    let srcString = LD_R8_R8;
    srcString = srcString.split("<regdest>").join(regArr[regDestId]);
    srcString = srcString.split("<regsrc>").join(regArr[regSrcId]);
    srcString = srcString.split("<regsrc_get>").join(regSrcGetArr[regSrcId]);
    // Special exception, as using 6, (HL) as a destination requires a function 
    // call with parameters. 
    if (regDestId != 6) {
        srcString = srcString.split("<regdest_set>").join(regDestSetArr[regDestId]);
    } else {
        srcString = srcString.split("<regdest_set>").join(`cpu.writeIndirectHl(${regSrcGetArr[regSrcId]}); //`);
    }

    addAppendix(`//table[${hex(opcode, 2)}] = LD_${regArr[regDestId]}_${regArr[regSrcId]};\n`);

    return srcString;
}

/**
 * 
 * @param {string} header 
 * @param {number} opcode 
 * @param {string} srcString 
 * @param {number} regDestId 
 * @param {number} bitIndex 
 * @param {boolean} isBitOp 
 */
function cb_replace(header, opcode, srcString, regDestId, bitIndex, isBitOp) {
    srcString = srcString.split("<regsrc>").join(regArr[regDestId]);
    srcString = srcString.split("<regdest>").join(regArr[regDestId]);
    srcString = srcString.split("<regsrc_get>").join(regSrcGetArr[regDestId]);
    srcString = srcString.split("<bit_index>").join(bitIndex.toString());

    if (regDestId != 6) {
        srcString = srcString.split("<regdest_set>").join(regDestSetArr[regDestId]);
    } else {
        srcString = srcString.split("<regdest_set>").join(`cpu.writeIndirectHl(final); //`);
    }

    if (isBitOp) {
        addAppendix(`//cb_table[${hex(opcode, 2)}] = ${header}_${regArr[regDestId]}_${bitIndex}\n`);
    } else {
        addAppendix(`//cb_table[${hex(opcode, 2)}] = ${header}_${regArr[regDestId]}\n`);
    }

    return srcString;
}

/**
 * 
 * @param {string} srcString 
 * @param {number} regDestId 
 */
function inc_dec_u8_replace(srcString, regDestId) {
    srcString = srcString.split("<regdest>").join(regArr[regDestId]);
    srcString = srcString.split("<regsrc_get>").join(regSrcGetArr[regDestId]);
    if (regDestId != 6) {
        srcString = srcString.split("<regdest_set>").join(regDestSetArr[regDestId]);
    } else {
        srcString = srcString.split("<regdest_set>").join(`cpu.writeIndirectHl(newValue); //`);
    }

    return srcString;
}

function ld_r8_u8_replace(srcString, regDestId) {
    srcString = srcString.split("<regdest>").join(regArr[regDestId]);

    if (regDestId != 6) {
        srcString = srcString.split("<regdest_set>").join(regDestSetArr[regDestId]);
    } else {
        srcString = srcString.split("<regdest_set>").join(`cpu.writeIndirectHl(imm); //`);
    }

    return srcString;
}

function rst_replace(srcString, vector) {
    srcString = srcString.split("<vector>").join(vector);
    return srcString;
}

/**
 * 
 * @param {string} add 
 * @returns {void}
 */
function addCode(add) {
    code += add;
}

/**
 * 
 * @param {string} add 
 * @returns {void}
 */
function addAppendix(add) {
    appendix += add;
}

for (let opcode = 0; opcode < 256; opcode++) {
    let x = (opcode >> 6) & 0b11;
    let y = (opcode >> 3) & 0b111;
    let z = (opcode >> 0) & 0b111;
    let q = (opcode >> 3) & 0b1;
    switch (opcode >> 6) {
        case 0b00:
            switch ((opcode >> 3) & 0b111) {
                case 0: addCode(cb_replace("RLC", opcode, RLC, z, y, false)); break;
                case 1: addCode(cb_replace("RRC", opcode, RRC, z, y, false)); break;
                case 2: addCode(cb_replace("RL", opcode, RL, z, y, false)); break;
                case 3: addCode(cb_replace("RR", opcode, RR, z, y, false)); break;
                case 4: addCode(cb_replace("SLA", opcode, SLA, z, y, false)); break;
                case 5: addCode(cb_replace("SRA", opcode, SRA, z, y, false)); break;
                case 6: addCode(cb_replace("SWAP", opcode, SWAP, z, y, false)); break;
                case 7: addCode(cb_replace("SRL", opcode, SRL, z, y, false)); break;
            }
            break;
        case 0b01:
            addCode(cb_replace("BIT", opcode, BIT, z, y, true));
            break;
        case 0b10:
            addCode(cb_replace("RES", opcode, RES, z, y, true));
            break;
        case 0b11:
            addCode(cb_replace("SET", opcode, SET, z, y, true));
            break;
    }
}


for (let opcode = 0; opcode < 256; opcode++) {
    let x = (opcode >> 6) & 0b11;
    let y = (opcode >> 3) & 0b111;
    let z = (opcode >> 0) & 0b111;
    let q = (opcode >> 3) & 0b1;
    switch (x) {
        // misc 0
        case 0:
            switch (z) {
                case 4:
                    addCode(inc_dec_u8_replace(INC_R8, y));
                    break;
                case 5:
                    addCode(inc_dec_u8_replace(DEC_R8, y));
                    break;
                case 6:
                    addCode(ld_r8_u8_replace(LD_R8_U8, y));
                    break;
            }
            break;
        // LD block
        case 1:
            addCode(ld_r_r_replace(opcode, y, z));
            break;
        // ALU block
        case 2:
            let regSrc = regArr[z];
            let regSrcGet = regSrcGetArr[z];
            switch (y) {
                case 0:
                    addCode(alu_replace(ADD_A_R8, regSrc, regSrcGet));
                    break;
                case 1:
                    addCode(alu_replace(ADC_A_R8, regSrc, regSrcGet));
                    break;
                case 2:
                    addCode(alu_replace(SUB_A_R8, regSrc, regSrcGet));
                    break;
                case 3:
                    addCode(alu_replace(SBC_A_R8, regSrc, regSrcGet));
                    break;
                case 4:
                    addCode(alu_replace(AND_A_R8, regSrc, regSrcGet));
                    break;
                case 5:
                    addCode(alu_replace(XOR_A_R8, regSrc, regSrcGet));
                    break;
                case 6:
                    addCode(alu_replace(OR_A_R8, regSrc, regSrcGet));
                    break;
                case 7:
                    addCode(alu_replace(CP_A_R8, regSrc, regSrcGet));
                    break;
            }
            break;
        // misc 1
        case 3:
            switch (z) {
                case 7:
                    addCode(rst_replace(RST, y * 8));
                    break;
            }
            break;
    }
}

code += appendix;
fs.writeFileSync('generated_code.ts', code);

/**
 * 
 * @param {number} i 
 * @param {number} digits 
 */
function hex(i, digits) {
    return `0x${pad(i.toString(16), digits, '0').toUpperCase()}`;
}

/**
 * 
 * @param {string} n 
 * @param {number} width 
 * @param {string} z 
 */
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}