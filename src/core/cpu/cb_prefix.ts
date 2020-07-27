import { CPU } from './cpu';
import { bitTest, bitReset, bitSet } from '../util/bits';

export function RLC(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;

    let oldVal = cpu.getReg(regIndex);
    let rotateBit = (oldVal & 0b10000000) >> 7;
    let newVal = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.setReg(regIndex, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RRC(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;

    let oldVal = cpu.getReg(regIndex);
    let rotateBit = (oldVal & 0b00000001) << 7;
    let newVal = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.setReg(regIndex, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function RL(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;

    let oldVal = cpu.getReg(regIndex);
    let rotateBit = cpu.carry ? 0b10000000 : 0;
    let newVal = ((oldVal << 1) & 0xFF) | rotateBit;

    cpu.setReg(regIndex, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function RR(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;

    let oldVal = cpu.getReg(regIndex);
    let rotateBit = cpu.carry ? 0b00000001 : 0;
    let newVal = ((oldVal >> 1) & 0xFF) | rotateBit;

    cpu.setReg(regIndex, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SLA(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;

    let oldVal = cpu.getReg(regIndex);
    let newVal = (oldVal << 1) & 0xFF;

    cpu.setReg(regIndex, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 7);
}

export function SRA(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;

    let oldVal = cpu.getReg(regIndex);
    let newVal = (oldVal >> 1) & 0xFF;

    cpu.setReg(regIndex, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = bitTest(oldVal, 0);
}

export function SWAP(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;
    let oldVal = cpu.getReg(regIndex);

    let lower = (oldVal >> 0) & 0xF;
    let upper = (oldVal >> 4) & 0xF;

    let newVal = (lower << 4) | upper;
 
    cpu.setReg(regIndex, newVal);

    cpu.zero = newVal == 0;
    cpu.negative = false;
    cpu.halfCarry = false;
    cpu.carry = false
}


export function BIT(cpu: CPU, opcode: number) {
    let val = cpu.getReg(opcode & 0b111);
    let bitIndex = (opcode >> 3) & 0b111;

    cpu.zero = !bitTest(val, bitIndex);
    cpu.negative = false;
    cpu.halfCarry = true;
}

export function RES(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;
    let val = cpu.getReg(regIndex);
    let bitIndex = (opcode >> 3) & 0b111;

    cpu.setReg(regIndex, bitReset(val, bitIndex));
}

export function SET(cpu: CPU, opcode: number) {
    let regIndex = opcode & 0b111;
    let val = cpu.getReg(regIndex);
    let bitIndex = (opcode >> 3) & 0b111;

    cpu.setReg(regIndex, bitSet(val, bitIndex));
}

export function JP_HL(cpu: CPU, opcode: number) {
    cpu.pc = cpu.getHl();
}