//! AXON quantum-tech: reference models for the 0-MUL vs multiplier MAC study.
//!
//! Three bit-exact datapaths over `LANES` int8 activations:
//! * [`mac_int8`]      dense int8 x int8 multiplier datapath (reference),
//! * [`mac_tern_mul`]  ternary weights through a multiplier,
//! * [`mac_0mul`]      AXON Sign-Select: skip / add / subtract, no multiply.
//!
//! The activity numbers are a *software proxy* for dynamic power
//! (P ~ alpha * C * V^2 * f): Hamming distance of datapath signals between
//! consecutive input vectors. They are NOT silicon or cryogenic measurements.

pub mod activity;
pub mod mac;
pub mod rng;
pub mod trit;

/// Number of lanes in the MAC cores (matches the RTL study in `evidence/cryo_0mul`).
pub const LANES: usize = 4;
