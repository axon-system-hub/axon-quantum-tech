# axon-quantum-tech

Rust reference models for the AXON **0-MUL (Sign-Select add/sub)** vs multiplier MAC study,
aimed at cryogenic quantum-control datapaths where thermal budget is the limiting factor.

## Status (evidence tiers)
- 🟢 Functional: `mac_0mul` is bit-exact with the ternary-multiplier MAC (`cargo test`).
- 🟠 ESTIMATED: activity numbers are a software proxy (Hamming distance of datapath signals),
  not silicon, gate-level power or 4K cryogenic measurements.
- 🔴 TARGET: Sky130 + OpenSTA power/timing, 4K device models, qubit pulse fidelity.

## Prior RTL result (Yosys, 4 lanes, no-ABC mapping, zero-delay sim)
Switching vs int8 multiplier: -74..-84 %. Against the *same ternary weights through a multiplier*
the gain is only -30 % (0 % zeros) shrinking to -4 % (66 % zeros), and area is ~14 % larger.
Most of the saving comes from ternary precision, not from the 0-MUL structure itself.

## Limits of the Rust proxy
`cargo run --release` shows identical activity for the ternary multiplier and 0-MUL paths
(and ~equal vs int8), because the proxy only observes per-lane terms and the accumulator, which are
bit-identical. It does NOT see switching inside a multiplier array, so it cannot show the structural
saving. That evidence must come from gate-level RTL/power analysis (see TARGET above).

## Usage
```
cargo test
cargo run --release
```
