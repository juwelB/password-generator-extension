# Generator interface spec

**Module:** `src/generator/generator.ts`
**Status:** Approved for v1
**Related decisions:** PWX-0003, PWX-0005, PWX-0007, PWX-0008, PWX-0010

## Summary
The generator takes a length from 8 to 32 and at least one of four character
types. It returns a password of exactly that length that includes every
chosen type, plus an estimate of its strength in bits. If it receives invalid
input, it stops with a clear error, because the popup should never send bad
input.

The generator is pure (PWX-0003): it never touches the DOM, the clipboard, or
storage. Its only outside dependency, the random source, is passed in.

## Contract
This is a signature-only description. The implementation must match it.

```ts
export const MIN_LENGTH = 8;
export const MAX_LENGTH = 32;
export const DEFAULT_LENGTH = 16;

export type CharSet = 'upperCase' | 'lowerCase' | 'digits' | 'symbols';

export const CHAR_SETS: Record<CharSet, string> = {
  upperCase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowerCase: 'abcdefghijklmnopqrstuvwxyz',
  digits:    '0123456789',
  symbols:   '!@#$%^&*()_+-=[]{}|;:<>?',
};

export interface GeneratorOptions {
  length: number;                  // whole number, MIN_LENGTH to MAX_LENGTH
  sets: readonly CharSet[];         // at least one
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
}

export function generatePassword(
  options: GeneratorOptions,
  random: RandomSource = (b) => crypto.getRandomValues(b),
): GeneratedPassword;
```

## Guarantees
For any valid input, `generatePassword` returns a password that:

1. Is exactly `options.length` characters long.
2. Contains at least one character from every selected set.
3. Contains no characters from unselected sets.
4. Was built using rejection sampling, so every character in the pool is
   equally likely (no modulo bias).
5. Was shuffled with a Fisher-Yates shuffle using the same random source, so
   the guaranteed characters can appear in any position.

`MIN_LENGTH` (8) is greater than the number of sets (4), so guarantee 2 can
always be met.

## Entropy
`entropyBits = length × log2(pool size)`, where the pool is every character
in the selected sets combined.

| Sets selected | Pool size | 16 chars | 32 chars |
|---|---|---|---|
| All four | 86 | ≈ 102.8 bits | ≈ 205.6 bits |
| Letters and digits | 62 | ≈ 95 bits | ≈ 191 bits |
| Lowercase only | 26 | ≈ 75 bits | ≈ 150 bits |

This is a slight overestimate, since guaranteeing one character per set
removes a small number of possible passwords. It is accurate enough for a
strength display.

## Invalid input
`generatePassword` throws a `GeneratorError` (see PWX-0008):

| Code | Thrown when |
|---|---|
| `INVALID_LENGTH` | `length` is not a whole number from 8 to 32 |
| `NO_CHARACTER_SETS` | `sets` is empty |
| `UNKNOWN_CHARACTER_SET` | `sets` contains a value not in `CHAR_SETS` |

Duplicate sets (for example, `['digits', 'digits']`) are treated as a single
selection, not an error.

## Out of scope for v1
- Passphrase mode (later milestone, as a second strategy)
- Excluding ambiguous characters (later milestone, own ADR)
- User-editable symbol list
