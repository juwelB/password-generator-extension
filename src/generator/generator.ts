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
    validateOptions(options);

    const uniqueSets = [...new Set(options.sets)];
    const pool = uniqueSets.map((set) => CHAR_SETS[set]).join("");
    const chars: string[] = [];

    // One character from each selected set
    for (const set of uniqueSets) {
        const setChars = CHAR_SETS[set];
        chars.push(setChars[randomIndex(setChars.length, random)]!);
    }

    // Fill the rest from the whole pool
    while (chars.length < options.length) {
        chars.push(pool[randomIndex(pool.length, random)]!);
    }
    shuffle(chars, random);
    const password = chars.join("");

    const entropyBits = options.length * Math.log2(pool.length);
    return { password, entropyBits };
}



function validateOptions(options: GeneratorOptions): void {
    const { length, sets } = options;

    if (!Number.isInteger(length) || length < MIN_LENGTH || length > MAX_LENGTH) {
        throw new GeneratorError("INVALID_LENGTH", "Length must be a whole number from 8 to 32");
    }

    if (sets.length === 0) {
        throw new GeneratorError("NO_CHARACTER_SETS", "At least one character set must be selected");
    }

    for (const set of sets) {
        if (!Object.hasOwn(CHAR_SETS, set)) {
            throw new GeneratorError("UNKNOWN_CHARACTER_SET", `Unknown character set: ${set}`);
        }
    }

}


function randomIndex(max: number, random: RandomSource): number {
    const range = 2 ** 32;
    const limit = range - (range % max);
    const buffer = new Uint32Array(1);

    while (true) {
        const value = random(buffer)[0]!;
        if (value < limit) {
            return value % max;
        }
    }
}


function shuffle(items: string[], random: RandomSource): void {
    for (let i = items.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1, random);
        [items[i], items[j]] = [items[j]!, items[i]!];
    }
}