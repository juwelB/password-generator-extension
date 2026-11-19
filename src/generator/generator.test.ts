import { describe, it, expect } from "vitest";
import {
    generatePassword,
    GeneratorError,
    CHAR_SETS,
    type CharSet,
    type GeneratorErrorCode,
    type RandomSource
} from "./generator";

const ALL_SETS: CharSet[] = ["upperCase", "lowerCase", "digits", "symbols"];
const RUNS = 1000;

// A fake random source that returns the given values in order, then 0 forever.
function fakeSource(values: number[]): RandomSource {
    let i = 0;
    return (buffer) => {
        buffer[0] = values[i] ?? 0;
        i++;
        return buffer;
    };
}

// True if the password contains at least one character from chars.
function containsAny(password: string, chars: string): boolean {
    return [...password].some((c) => chars.includes(c));
}

// True if every character of the password comes from chars.
function onlyFrom(password: string, chars: string): boolean {
    return [...password].every((c) => chars.includes(c));
}
// Checks that fn throws a GeneratorError with the given code.
function expectGeneratorError(fn: () => unknown, code: GeneratorErrorCode): void {
    try {
        fn();
    } catch (error) {
        expect(error).toBeInstanceOf(GeneratorError);
        if (error instanceof GeneratorError) {
            expect(error.code).toBe(code);
        }
        return;
    }
    expect.fail("Expected a GeneratorError, but nothing was thrown");
}

describe("generatePassword", () => {
    describe("length", () => {
        it("1.1 produces exactly 8 characters at the lower boundary", () => {
            const result = generatePassword({ length: 8, sets: ALL_SETS });
            expect(result.password).toHaveLength(8);
        });

        it("1.2 produces exactly 16 characters at the default length", () => {
            const result = generatePassword({ length: 16, sets: ALL_SETS });
            expect(result.password).toHaveLength(16);
        });

        it("1.3 produces exactly 32 characters at the upper boundary", () => {
            const result = generatePassword({ length: 32, sets: ALL_SETS });
            expect(result.password).toHaveLength(32);
        });


    });

    describe("character rules", () => {
        it("2.1 includes every selected set", () => {
            for (let i = 0; i < RUNS; i++) {
                const { password } = generatePassword({ length: 16, sets: ALL_SETS });
                for (const set of ALL_SETS) {
                    expect(containsAny(password, CHAR_SETS[set]), `${password} is missing ${set}`).toBe(true);
                }
            }
        });

        it("2.2 uses no characters from unselected sets", () => {
            const allowed = CHAR_SETS.lowerCase + CHAR_SETS.digits;
            for (let i = 0; i < RUNS; i++) {
                const { password } = generatePassword({ length: 16, sets: ["lowerCase", "digits"] });
                expect(onlyFrom(password, allowed), `${password} has a disallowed character`).toBe(true);
            }
        });

        it("2.3 uses only the chosen set when one set is selected", () => {
            for (const set of ALL_SETS) {
                for (let i = 0; i < RUNS; i++) {
                    const { password } = generatePassword({ length: 16, sets: [set] });
                    expect(onlyFrom(password, CHAR_SETS[set]), `${password} is not all ${set}`).toBe(true);
                }
            }
        });

        it("2.4 places guaranteed characters in any position", () => {
            const firstCharSets = new Set<CharSet>();
            for (let i = 0; i < RUNS; i++) {
                const { password } = generatePassword({ length: 16, sets: ALL_SETS });
                for (const set of ALL_SETS) {
                    if (CHAR_SETS[set].includes(password[0]!)) {
                        firstCharSets.add(set);
                    }
                }
            }
            expect(firstCharSets.size).toBe(4);
        });


    });
    describe("randomness quality", () => {
        it("3.1 gives different passwords on consecutive calls", () => {
            const a = generatePassword({ length: 16, sets: ALL_SETS }).password;
            const b = generatePassword({ length: 16, sets: ALL_SETS }).password;
            expect(a).not.toBe(b);
        });

        it("3.2 uses every character about equally often", () => {
            const chars = CHAR_SETS.lowerCase;
            const counts = new Map<string, number>();
            const passwords = 10_000;
            for (let i = 0; i < passwords; i++) {
                for (const c of generatePassword({ length: 16, sets: ["lowerCase"] }).password) {
                    counts.set(c, (counts.get(c) ?? 0) + 1);
                }
            }
            const expected = (passwords * 16) / chars.length;
            for (const c of chars) {
                const count = counts.get(c) ?? 0;
                expect(Math.abs(count - expected), `'${c}' appeared ${count} times`).toBeLessThan(expected * 0.1);
            }
        });
    });

    describe("fake random source", () => {
        it("4.1 gives identical passwords for identical random values", () => {
            const values = [5, 17, 42, 99, 3, 8, 1, 60];
            const a = generatePassword({ length: 8, sets: ALL_SETS }, fakeSource(values)).password;
            const b = generatePassword({ length: 8, sets: ALL_SETS }, fakeSource(values)).password;
            expect(a).toBe(b);
        });

        it("4.2 discards values in the biased range", () => {
            const biased = 0xffffffff;
            const result = generatePassword({ length: 8, sets: ["digits"] }, fakeSource([biased]));
            expect(result.password).toBe("00000000");
        });
    });

    describe("entropy", () => {
        it("5.1 reports about 102.8 bits for all sets at length 16", () => {
            const { entropyBits } = generatePassword({ length: 16, sets: ALL_SETS });
            expect(entropyBits).toBeCloseTo(102.82, 1);
        });

        it("5.2 reports about 205.6 bits for all sets at length 32", () => {
            const { entropyBits } = generatePassword({ length: 32, sets: ALL_SETS });
            expect(entropyBits).toBeCloseTo(205.64, 1);
        });

        it("5.3 reports about 75 bits for lowercase only at length 16", () => {
            const { entropyBits } = generatePassword({ length: 16, sets: ["lowerCase"] });
            expect(entropyBits).toBeCloseTo(75.2, 1);
        });
    });



    describe("invalid input", () => {
        it("6.1 rejects length 7", () => {
            expectGeneratorError(
                () => generatePassword({ length: 7, sets: ALL_SETS }),
                "INVALID_LENGTH",
            );
        });

        it("6.2 rejects length 33", () => {
            expectGeneratorError(
                () => generatePassword({ length: 33, sets: ALL_SETS }),
                "INVALID_LENGTH",
            );
        });

        it("6.3 rejects a decimal length", () => {
            expectGeneratorError(
                () => generatePassword({ length: 16.5, sets: ALL_SETS }),
                "INVALID_LENGTH",
            );
        });

        it("6.4 rejects NaN as a length", () => {
            expectGeneratorError(
                () => generatePassword({ length: NaN, sets: ALL_SETS }),
                "INVALID_LENGTH",
            );
        });

        it("6.5 rejects an empty list of sets", () => {
            expectGeneratorError(
                () => generatePassword({ length: 16, sets: [] }),
                "NO_CHARACTER_SETS",
            );
        });
        it("6.6 rejects an unknown set name", () => {
            expectGeneratorError(
                () => generatePassword({ length: 16, sets: ["emoji" as CharSet] }),
                "UNKNOWN_CHARACTER_SET",
            );
        });
        it("6.7 treats duplicate sets as a single selection", () => {
            expect(() =>
                generatePassword({ length: 16, sets: ["digits", "digits"] }),
            ).not.toThrow();
        });
    });
});