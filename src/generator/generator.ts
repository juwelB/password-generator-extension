export const MIN_LENGTH = 8;
export const MAX_LENGTH = 32;
export const DEFAULT_LENGTH = 16;

export type CharSet = 'upperCase' | 'lowerCase' | 'digits' | 'symbols';


export const CHAR_SETS: Record<CharSet, string> = {
    upperCase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowerCase: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

export interface GeneratorOptions {
    length: number;                  // whole number, MIN_LENGTH to MAX_LENGTH
    sets: readonly CharSet[];   // at least one
}

export interface GeneratedPassword {
    password: string;
    entropyBits: number;             // estimate: length × log2(pool size)
}



// Same shape as crypto.getRandomValues, so tests can pass a fake
export type RandomSource = (buffer: Uint32Array<ArrayBuffer>) => Uint32Array<ArrayBuffer>;


export type GeneratorErrorCode =
    | 'INVALID_LENGTH'
    | 'NO_CHARACTER_SETS'
    | 'UNKNOWN_CHARACTER_SET';



export class GeneratorError extends Error {

    readonly code: GeneratorErrorCode;

    constructor(code: GeneratorErrorCode, message: string) {
        super(message);
        this.name = "GeneratorError";
        this.code = code;
    }
}

export function generatePassword(
    options: GeneratorOptions,
    random: RandomSource = (b) => crypto.getRandomValues(b),
): GeneratedPassword {
    throw new Error("Not implemented");
}