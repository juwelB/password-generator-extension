# Architecture Decision Records

Each file in this folder records one design decision: its context, the
options considered, what was chosen, and why. Accepted ADRs are not edited, except to mark them superseded.
A changed decision gets a new ADR that supersedes the old one.

Files are named `PWX-NNNN.md`, numbered in the order decisions are made.
This index is the place to look up what each ID covers.

| ID | Decision | Status |
|---|---|---|
| [PWX-0001](PWX-0001.md) | Use TypeScript, Vite, and Manifest V3 | Accepted; linting superseded by PWX-0011 |
| [PWX-0002](PWX-0002.md) | Limit v1 to a popup, with no stored passwords | Accepted |
| [PWX-0003](PWX-0003.md) | Use a functional-core, imperative-shell architecture | Accepted |
| [PWX-0004](PWX-0004.md) | Use a safe subset of symbols | Superseded by PWX-0009 |
| [PWX-0005](PWX-0005.md) | Default password length of 16 characters | Accepted |
| [PWX-0006](PWX-0006.md) | Auto-generate a password when the popup opens | Accepted |
| [PWX-0007](PWX-0007.md) | Popup behavior defaults | Accepted |
| [PWX-0008](PWX-0008.md) | Throw a typed error on invalid generator input | Accepted |
| [PWX-0009](PWX-0009.md) | Use an expanded symbol set | Superseded by PWX-0010 |
| [PWX-0010](PWX-0010.md) | Remove period and comma from the symbol set | Accepted |
| [PWX-0011](PWX-0011.md) | Use Oxlint instead of ESLint | Accepted |
