import { CPU, UNPREFIXED_TABLE, Instruction } from "./cpu/cpu";
import { hexN, unTwo8b } from './util/misc';

let lengthTable = [
    1, 3, 1, 1, 1, 1, 2, 1, 3, 1, 1, 1, 1, 1, 2, 1,
    1, 3, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1,
    2, 3, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1,
    2, 3, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1,
    // LD quadrant
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    // ALU quadrant
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,

    1, 1, 3, 3, 3, 1, 2, 1, 1, 1, 3, 2, 3, 3, 2, 1,
    1, 1, 3, 0, 3, 1, 2, 1, 1, 1, 3, 0, 3, 0, 2, 1,
    2, 1, 2, 0, 0, 1, 2, 1, 2, 1, 3, 0, 0, 0, 2, 1,
    2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 3, 1, 0, 0, 2, 1,
];

enum InstructionType {
    NOP = "NOP",
    STOP = "STOP",
    LD_iN16_SP = "LD_iN16_SP",
    JR = "JR",
    JR_CC = "JR_CC",

    LD_R16_N16 = "LD_R16_N16",
    ADD_HL_R16 = "ADD_HL_R16",

    LD_iBC_A = "LD_iBC_A",
    LD_iDE_A = "LD_iDE_A",
    LD_HLinc_A = "LD_HLinc_A",
    LD_HLdec_A = "LD_HLdec_A",
    LD_A_iBC = "LD_A_iBC",
    LD_A_iDE = "LD_A_iDE",
    LD_A_HLinc = "LD_A_HLinc",
    LD_A_HLdec = "LD_A_HLdec",

    INC_R16 = "INC_R16",
    DEC_R16 = "DEC_R16",

    INC_R8 = "INC_R8",
    DEC_R8 = "DEC_R8",

    LD_R8_N8 = "LD_R8_N8",

    RLCA = "RLCA",
    RRCA = "RRCA",
    RLA = "RLA",
    RRA = "RRA",
    DAA = "DAA",
    CPL = "CPL",
    SCF = "SCF",
    CCF = "CCF",

    LD_R8_R8 = "LD_R8_R8",
    HALT = "HALT",

    ADD_A_R8 = "ADD_A_R8",
    ADC_A_R8 = "ADC_A_R8",
    SUB_A_R8 = "SUB_A_R8",
    SBC_A_R8 = "SBC_A_R8",
    AND_A_R8 = "AND_A_R8",
    XOR_A_R8 = "XOR_A_R8",
    OR_A_R8 = "OR_A_R8",
    CP_A_R8 = "CP_A_R8",

    RET_CC = "RET_CC",
    LD_iFF00plusU8_A = "LD_iFF00plusU8_A",
    ADD_SP_E8 = "ADD_SP_E8",
    LD_A_iFF00plusU8 = "LD_A_iFF00plusU8",
    LD_HL_SPplusE8 = "LD_HL_SPplusE8",

    POP_R16 = "POP_R16",
    RET = "RET",
    RETI = "RETI",
    JP_HL = "JP_HL",
    LD_SP_HL = "LD_SP_HL",
    JP_CC = "JP_CC",
    LD_iFF00plusC_A = "LD_iFF00plusC_A",
    LD_iR16_A = "LD_iR16_A",
    LD_A_iFF00plusC = "LD_A_iFF00plusC",
    LD_A_iR16 = "LD_A_iR16",

    JP = "JP",
    CB_PREFIX = "CB_PREFIX",
    DI = "DI",
    EI = "EI",

    CALL_CC = "CALL_CC",
    PUSH_R16 = "PUSH_R16",
    CALL = "CALL",

    ADD_A_N8 = "ADD_A_N8",
    ADC_A_N8 = "ADC_A_N8",
    SUB_A_N8 = "SUB_A_N8",
    SBC_A_N8 = "SBC_A_N8",
    AND_A_N8 = "AND_A_N8",
    XOR_A_N8 = "XOR_A_N8",
    OR_A_N8 = "OR_A_N8",
    CP_A_N8 = "CP_A_N8",

    RST = "RST",

    INVALID = "INVALID",

    RLC = "RLC",
    RRC = "RRC",
    RL = "RL",
    RR = "RR",
    SLA = "SLA",
    SRA = "SRA",
    SWAP = "SWAP",
    SRL = "SRL",
    BIT = "BIT",
    RES = "RES",
    SET = "SET",
}

function decodeType(opcode: number): InstructionType {
    let x = (opcode >> 6) & 0b11;
    let y = (opcode >> 3) & 0b111;
    let z = (opcode >> 0) & 0b111;
    let p = (opcode >> 4) & 0b11;
    let q = (opcode >> 3) & 0b1;

    switch (x) {
        case 0:
            switch (z) {
                case 0:
                    switch (y) {
                        case 0: return InstructionType.NOP;
                        case 1: return InstructionType.LD_iN16_SP;
                        case 2: return InstructionType.STOP;
                        case 3: return InstructionType.JR;
                        case 4: return InstructionType.JR_CC;
                        case 5: return InstructionType.JR_CC;
                        case 6: return InstructionType.JR_CC;
                        case 7: return InstructionType.JR_CC;
                    }
                    break;
                case 1:
                    switch (q) {
                        case 0: return InstructionType.LD_R16_N16;
                        case 1: return InstructionType.ADD_HL_R16;
                    }
                    break;
                case 2:
                    switch (q) {
                        case 0:
                            switch (p) {
                                case 0: return InstructionType.LD_iBC_A;
                                case 1: return InstructionType.LD_iDE_A;
                                case 2: return InstructionType.LD_HLinc_A;
                                case 3: return InstructionType.LD_HLdec_A;
                            }
                            break;
                        case 1:
                            switch (p) {
                                case 0: return InstructionType.LD_A_iBC;
                                case 1: return InstructionType.LD_A_iDE;
                                case 2: return InstructionType.LD_A_HLinc;
                                case 3: return InstructionType.LD_A_HLdec;
                            }
                            break;
                    }
                    break;
                case 3:
                    switch (q) {
                        case 0: return InstructionType.INC_R16;
                        case 1: return InstructionType.DEC_R16;
                    }
                    break;
                case 4:
                    return InstructionType.INC_R8;
                case 5:
                    return InstructionType.DEC_R8;
                case 6:
                    return InstructionType.LD_R8_N8;
                case 7:
                    switch (y) {
                        case 0: return InstructionType.RLCA;
                        case 1: return InstructionType.RRCA;
                        case 2: return InstructionType.RLA;
                        case 3: return InstructionType.RRA;
                        case 4: return InstructionType.DAA;
                        case 5: return InstructionType.CPL;
                        case 6: return InstructionType.SCF;
                        case 7: return InstructionType.CCF;
                    }
                    break;
            }
            break;
        case 1:
            if (z == 6 && y == 6) {
                return InstructionType.HALT;
            } else {
                return InstructionType.LD_R8_R8;
            }
        case 2:
            switch (y) {
                case 0: return InstructionType.ADD_A_R8;
                case 1: return InstructionType.ADC_A_R8;
                case 2: return InstructionType.SUB_A_R8;
                case 3: return InstructionType.SBC_A_R8;
                case 4: return InstructionType.AND_A_R8;
                case 5: return InstructionType.XOR_A_R8;
                case 6: return InstructionType.OR_A_R8;
                case 7: return InstructionType.CP_A_R8;
            }
            break;
        case 3:
            switch (z) {
                case 0:
                    switch (y) {
                        case 0: return InstructionType.RET_CC;
                        case 1: return InstructionType.RET_CC;
                        case 2: return InstructionType.RET_CC;
                        case 3: return InstructionType.RET_CC;
                        case 4: return InstructionType.LD_iFF00plusU8_A;
                        case 5: return InstructionType.ADD_SP_E8;
                        case 6: return InstructionType.LD_A_iFF00plusU8;
                        case 7: return InstructionType.LD_HL_SPplusE8;
                    }
                    break;
                case 1:
                    switch (q) {
                        case 0: return InstructionType.POP_R16;
                        case 1:
                            switch (p) {
                                case 0: return InstructionType.RET;
                                case 1: return InstructionType.RETI;
                                case 2: return InstructionType.JP_HL;
                                case 3: return InstructionType.LD_SP_HL;
                            }
                    }
                    break;
                case 2:
                    switch (y) {
                        case 0: return InstructionType.JP_CC;
                        case 1: return InstructionType.JP_CC;
                        case 2: return InstructionType.JP_CC;
                        case 3: return InstructionType.JP_CC;
                        case 4: return InstructionType.LD_iFF00plusC_A;
                        case 5: return InstructionType.LD_iR16_A;
                        case 6: return InstructionType.LD_A_iFF00plusC;
                        case 7: return InstructionType.LD_A_iR16;
                    }
                    break;
                case 3:
                    switch (y) {
                        case 0: return InstructionType.JP;
                        case 1: return InstructionType.CB_PREFIX;
                        case 2: return InstructionType.INVALID;
                        case 3: return InstructionType.INVALID;
                        case 4: return InstructionType.INVALID;
                        case 5: return InstructionType.INVALID;
                        case 6: return InstructionType.DI;
                        case 7: return InstructionType.EI;
                    }
                    break;
                case 4:
                    switch (y) {
                        case 0: return InstructionType.CALL_CC;
                        case 1: return InstructionType.CALL_CC;
                        case 2: return InstructionType.CALL_CC;
                        case 3: return InstructionType.CALL_CC;
                        case 4: return InstructionType.INVALID;
                        case 5: return InstructionType.INVALID;
                        case 6: return InstructionType.INVALID;
                        case 7: return InstructionType.INVALID;
                    }
                    break;
                case 5:
                    switch (q) {
                        case 0:
                            return InstructionType.PUSH_R16;
                        case 1:
                            switch (p) {
                                case 0: return InstructionType.CALL;
                                case 1: return InstructionType.INVALID;
                                case 2: return InstructionType.INVALID;
                                case 3: return InstructionType.INVALID;
                            }
                            break;
                    }
                    break;
                case 6:
                    switch (y) {
                        case 0: return InstructionType.ADD_A_N8;
                        case 1: return InstructionType.ADC_A_N8;
                        case 2: return InstructionType.SUB_A_N8;
                        case 3: return InstructionType.SBC_A_N8;
                        case 4: return InstructionType.AND_A_N8;
                        case 5: return InstructionType.XOR_A_N8;
                        case 6: return InstructionType.OR_A_N8;
                        case 7: return InstructionType.CP_A_N8;
                    }
                    break;
                case 7:
                    return InstructionType.RST;
            }
            break;
    }

    return InstructionType.INVALID;
}

function cbDecodeType(opcode: number): InstructionType {
    let x = (opcode >> 6) & 0b11;
    let y = (opcode >> 3) & 0b111;
    let z = (opcode >> 0) & 0b111;

    switch (x) {
        case 0:
            switch (y) {
                case 0: return InstructionType.RLC;
                case 1: return InstructionType.RRC;
                case 2: return InstructionType.RL;
                case 3: return InstructionType.RR;
                case 4: return InstructionType.SLA;
                case 5: return InstructionType.SRA;
                case 6: return InstructionType.SWAP;
                case 7: return InstructionType.SRL;
            }
            break;
        case 1:
            return InstructionType.BIT;
        case 2:
            return InstructionType.RES;
        case 3:
            return InstructionType.SET;
    }

    return InstructionType.INVALID;
}

const r8 = ["B", "C", "D", "E", "H", "L", "(HL)", "A"];
const cc = ["NZ", "Z", "NC", "C"];
const r16_0 = ["BC", "DE", "HL", "SP"];
const r16_1 = ["BC", "DE", "HL", "AF"];

function disassembleInstruction(opcode: number, operand: number, pc: number): string {
    let x = (opcode >> 6) & 0b11;
    let y = (opcode >> 3) & 0b111;
    let z = (opcode >> 0) & 0b111;
    let p = (opcode >> 4) & 0b11;
    let q = (opcode >> 3) & 0b1;

    let decodedType = decodeType(opcode);

    switch (decodedType) {
        case InstructionType.NOP:
            return "NOP";
        case InstructionType.JP:
            return `JP $${hexN(operand, 4)}`;
        case InstructionType.JR: // +2 is accounting for instruction length
            return `JR $${hexN((pc + unTwo8b(operand)), 4)}`;
        case InstructionType.JR_CC:
            return `JR ${cc[y - 4]}, $${hexN((pc + unTwo8b(operand)), 4)}`;
        case InstructionType.LD_R16_N16:
            return `LD ${r16_0[p]}, $${hexN(operand, 4)}`;
        case InstructionType.LD_iN16_SP:
            return `LD ($${hexN(operand, 4)}), SP`;

        case InstructionType.JP: return `JP $${hexN(operand, 4)}`;
        case InstructionType.JP_CC: return `JP ${cc[y]}, $${hexN(operand, 4)}`;

        case InstructionType.CALL: return `CALL $${hexN(operand, 4)}`;
        case InstructionType.CALL_CC: return `CALL ${cc[y]}, $${hexN(operand, 4)}`;

        case InstructionType.ADD_A_N8: return `ADD A, $${hexN(operand, 2)}`;
        case InstructionType.ADC_A_N8: return `ADC A, $${hexN(operand, 2)}`;
        case InstructionType.SUB_A_N8: return `SUB A, $${hexN(operand, 2)}`;
        case InstructionType.SBC_A_N8: return `SBC A, $${hexN(operand, 2)}`;
        case InstructionType.AND_A_N8: return `AND A, $${hexN(operand, 2)}`;
        case InstructionType.XOR_A_N8: return `XOR A, $${hexN(operand, 2)}`;
        case InstructionType.OR_A_N8: return `OR A, $${hexN(operand, 2)}`;
        case InstructionType.CP_A_N8: return `CP A, $${hexN(operand, 2)}`;

        case InstructionType.ADD_A_R8: return `ADD A, ${r8[z]}`;
        case InstructionType.ADC_A_R8: return `ADC A, ${r8[z]}`;
        case InstructionType.SUB_A_R8: return `SUB A, ${r8[z]}`;
        case InstructionType.SBC_A_R8: return `SBC A, ${r8[z]}`;
        case InstructionType.AND_A_R8: return `AND A, ${r8[z]}`;
        case InstructionType.XOR_A_R8: return `XOR A, ${r8[z]}`;
        case InstructionType.OR_A_R8: return `OR A, ${r8[z]}`;
        case InstructionType.CP_A_R8: return `CP A, ${r8[z]}`;

        case InstructionType.DEC_R8: return `DEC ${r8[y]}`;
        case InstructionType.INC_R8: return `INC ${r8[y]}`;

        case InstructionType.DEC_R16: return `DEC ${r16_0[p]}`;
        case InstructionType.INC_R16: return `INC ${r16_0[p]}`;

        case InstructionType.HALT: return `HALT`;

        case InstructionType.RETI: return `RETI`;
        case InstructionType.RET: return `RET`;
        case InstructionType.RET_CC: return `RET ${cc[y]}`;

        case InstructionType.LD_iDE_A: return `LD (DE), A`;
        case InstructionType.LD_A_iDE: return `LD A, (DE)`;
        case InstructionType.LD_iBC_A: return `LD (BC), A`;
        case InstructionType.LD_A_iBC: return `LD A, (BC)`;

        case InstructionType.RST: return `RST $${hexN(y << 3, 2)}`;

        case InstructionType.LD_A_iFF00plusU8: return `LD A, ($FF${hexN(operand, 2)})`;
        case InstructionType.LD_iFF00plusU8_A: return `LD ($FF${hexN(operand, 2)}), A`;
        case InstructionType.LD_A_iFF00plusC: return `LD A, ($FF00+C)`;
        case InstructionType.LD_iFF00plusC_A: return `LD ($FF00+C), A`;

        case InstructionType.LD_R8_R8: return `LD ${r8[y]}, ${r8[z]}`;
        case InstructionType.LD_R8_N8: return `LD ${r8[y]}, $${hexN(operand, 2)}`;

        case InstructionType.LD_HLdec_A: return "LD (HL-), A";
        case InstructionType.LD_A_HLdec: return "LD A, (HL-)";
        case InstructionType.LD_HLinc_A: return "LD (HL+), A";
        case InstructionType.LD_A_HLinc: return "LD A, (HL+)";

        case InstructionType.LD_A_iR16: return `LD A, ($${hexN(operand, 4)})`;
        case InstructionType.LD_iR16_A: return `LD ($${hexN(operand, 4)}), A`;

        case InstructionType.ADD_HL_R16: return `ADD HL, ${r16_0[p]}`;

        case InstructionType.EI: return "EI";
        case InstructionType.DI: return "DI";
        
        case InstructionType.CPL: return "CPL";

        case InstructionType.RLCA: return "RLCA";
        case InstructionType.RRCA: return "RRCA";
        case InstructionType.RRA: return "RRA";
        case InstructionType.RLA: return "RLA";

        case InstructionType.POP_R16: return `POP ${r16_1[p]}`;
        case InstructionType.PUSH_R16: return `PUSH ${r16_1[p]}`;

        case InstructionType.DAA: return "DAA";

        case InstructionType.CB_PREFIX:
            y = (operand >> 3) & 0b111;
            z = (operand >> 0) & 0b111;
            p = (operand >> 4) & 0b11;
            let cbDecodedType = cbDecodeType(operand);
            switch (cbDecodedType) {
                case InstructionType.RLC: return `RLC ${r8[y]}`;
                case InstructionType.RRC: return `RRC ${r8[y]}`;
                case InstructionType.RL: return `RL ${r8[y]}`;
                case InstructionType.RR: return `RR ${r8[y]}`;
                case InstructionType.SLA: return `SLA ${r8[y]}`;
                case InstructionType.SRA: return `SRA ${r8[y]}`;
                case InstructionType.SWAP: return `SWAP ${r8[y]}`;
                case InstructionType.SRL: return `SRL ${r8[y]}`;

                case InstructionType.BIT: return `BIT ${y}, ${r8[z]}`;
                case InstructionType.RES: return `RES ${y}, ${r8[z]}`;
                case InstructionType.SET: return `SET ${y}, ${r8[z]}`;
            }
            return `CB ${cbDecodedType}`;
    }
    return `Implement: ${decodedType}`;
}

let disasmArr = new Array(65536);

type DisassembledLine = {
    meta: string,
    disasm: string,
    addr: number,
};

export function disassemble(cpu: CPU, disasmPc: number, count: number): DisassembledLine[] {
    let arr: DisassembledLine[] = [];

    for (let i = 0; i < count; i++) {
        let opcode = cpu.gb.bus.read8(disasmPc);
        let bytes = `-- -- --`;

        let length = lengthTable[opcode];
        let operand = 0;
        switch (length) {
            case 1:
                bytes = `${hexN(opcode, 2)} -- --`;
                break;
            case 2:
                operand = cpu.gb.bus.read8((disasmPc + 1) & 0xFFFF);
                bytes = `${hexN(opcode, 2)} ${hexN(operand, 2)} --`;
                break;
            case 3:
                let low = cpu.gb.bus.read8((disasmPc + 1) & 0xFFFF);
                let high = cpu.gb.bus.read8((disasmPc + 2) & 0xFFFF);
                bytes = `${hexN(opcode, 2)} ${hexN(low, 2)} ${hexN(high, 2)}`;
                operand = (high << 8) | low;
                break;
        }
        let atPc = disasmPc == cpu.pc ? "PC->" : "    ";
        let isBreakpoint = cpu.breakpoints[disasmPc] ? "[BRK]" : "     ";

        arr.push({
            meta: `${isBreakpoint} ${atPc} ${hexN(disasmPc, 4)} ${bytes}`,
            disasm: disassembleInstruction(opcode, operand, disasmPc),
            addr: disasmPc
        });

        disasmPc = (disasmPc + length) & 0xFFFF;
    }

    return arr;
}