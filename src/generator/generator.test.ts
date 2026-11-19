import { describe, it, expect } from "vitest";
import {
    generatePassword,
    GeneratorError,
    type CharSet,
    type GeneratorErrorCode,
} from "./generator";

const ALL_SETS: CharSet[] = ["upperCase", "lowerCase", "digits", "symbols"];

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