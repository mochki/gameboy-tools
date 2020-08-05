// #region Accumulator Arithmetic

const fs = require('fs');

const ADD_A_R8 = `
export function ADD_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function ADC_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function SUB_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function SBC_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function AND_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function XOR_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function OR_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function CP_A_<regsrc>(cpu: CPU, opcode: number): void {
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
export function LD_<regdest>_<regsrc>(cpu: CPU, opcode: number): void {
    <regdest_set> = <regsrc_get>;
};
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
function aluBlockReplace(srcString, regSrc, regSrcGet) {
    // I love the JavaScript "standard library." I have to split and join 
    // strings together instead of using a replace-all function that the language doesn't provide.
    srcString = srcString.split("<regsrc>").join(regSrc);
    srcString = srcString.split("<regsrc_get>").join(regSrcGet);
    return srcString;
}

/**
 * 
 * @param {string} regSrcId 
 * @param {string} regDestId 
 */
function ldBlock(opcode, regDestId, regSrcId) {
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
    switch (x) {
        // misc 0
        case 0:
            break;
        // LD block
        case 1:
            addCode(ldBlock(opcode, y, z));
            break;
        // ALU block
        case 2:
            let regSrc = regArr[z];
            let regSrcGet = regSrcGetArr[z];
            switch (y) {
                case 0:
                    addCode(aluBlockReplace(ADD_A_R8, regSrc, regSrcGet));
                    break;
                case 1:
                    addCode(aluBlockReplace(ADC_A_R8, regSrc, regSrcGet));
                    break;
                case 2:
                    addCode(aluBlockReplace(SUB_A_R8, regSrc, regSrcGet));
                    break;
                case 3:
                    addCode(aluBlockReplace(SBC_A_R8, regSrc, regSrcGet));
                    break;
                case 4:
                    addCode(aluBlockReplace(AND_A_R8, regSrc, regSrcGet));
                    break;
                case 5:
                    addCode(aluBlockReplace(XOR_A_R8, regSrc, regSrcGet));
                    break;
                case 6:
                    addCode(aluBlockReplace(OR_A_R8, regSrc, regSrcGet));
                    break;
                case 7:
                    addCode(aluBlockReplace(CP_A_R8, regSrc, regSrcGet));
                    break;
            }
            break;
        // misc 1
        case 3:
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