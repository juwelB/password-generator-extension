# Generator test plan

**Module under test:** `src/generator/generator.ts`
**Test file:** `src/generator/generator.test.ts`
**Framework:** Vitest (PWX-0001)
**Spec:** [generator-spec.md](generator-spec.md)

## Approach
A random generator can't be tested against one exact output, so the plan
uses two techniques:

- **Property-based checks.** Generate many passwords (1,000 per test) and
  check that every one meets a rule, such as "contains a digit."
- **A fake random source.** The generator accepts its random source as a
  parameter (PWX-0003). Tests pass in known numbers to get an exact,
  predictable result.

Tests are written before the implementation (test-driven development).

## 1. Length
| # | Test | Expected |
|---|---|---|
| 1.1 | Length 8 (lower boundary) | Exactly 8 characters |
| 1.2 | Length 16 (default) | Exactly 16 characters |
| 1.3 | Length 32 (upper boundary) | Exactly 32 characters |

## 2. Character rules (1,000 runs each)
| # | Test | Expected |
|---|---|---|
| 2.1 | All four sets selected | Every password contains at least one character from each set |
| 2.2 | A subset selected (for example, lowercase and digits) | No characters from unselected sets |
| 2.3 | Each set alone | Every character comes from that set |

## 3. Randomness quality
| # | Test | Expected |
|---|---|---|
| 3.1 | Two calls in a row | Different passwords |
| 3.2 | Character frequency over many passwords | Every pool character appears roughly equally often, within a tolerance |

## 4. Fake random source
| # | Test | Expected |
|---|---|---|
| 4.1 | Same fake values, two calls | Identical passwords |
| 4.2 | Rejection sampling: fake source returns a value in the biased range at the top of `Uint32`, then a normal value | The biased value is discarded and the normal value is used |

## 5. Entropy
| # | Test | Expected |
|---|---|---|
| 5.1 | All four sets, length 16 | ≈ 103 bits |
| 5.2 | All four sets, length 32 | ≈ 207 bits |
| 5.3 | Lowercase only, length 16 | ≈ 75 bits |

## 6. Invalid input
Each test checks that a `GeneratorError` is thrown with the specific `code`
(PWX-0008).

| # | Input | Expected | Why it's tested |
|---|---|---|---|
| 6.1 | Length 7 | `INVALID_LENGTH` | Below the range |
| 6.2 | Length 33 | `INVALID_LENGTH` | Above the range |
| 6.3 | Length 16.5 | `INVALID_LENGTH` | Passes a simple range check; needs `Number.isInteger` |
| 6.4 | Length `NaN` | `INVALID_LENGTH` | All comparisons with `NaN` are false, so it also slips past a range check |
| 6.5 | Empty `sets` | `NO_CHARACTER_SETS` | |
| 6.6 | Unknown set name | `UNKNOWN_CHARACTER_SET` | Types are erased at runtime, so bad strings can still arrive |
| 6.7 | Duplicate sets | No error; treated as one selection | |
