//! Quantum Error Correction (QEC) reference decoders and models.
//!
//! Includes:
//! 1. 3-Qubit Bit-Flip Code `[[3, 1, 1]]`:
//!    - Stabilizers: S1 = Z0 Z1, S2 = Z1 Z2
//!    - Hard decision syndrome decoding.
//!    - Soft decision syndrome extraction via 0-MUL ternary parity check:
//!      Parity weights W0 = [+1, -1, 0], W1 = [0, +1, -1] evaluated over
//!      int8 analog demodulated readout signals via `mac_0mul` Sign-Select.
//!
//! 2. 5-Qubit Perfect Code `[[5, 1, 3]]`:
//!    - Stabilizers:
//!      g1 = X Z Z X I
//!      g2 = I X Z Z X
//!      g3 = X I X Z Z
//!      g4 = Z X I X Z
//!    - Uniquely identifies and corrects all 15 single-qubit Pauli X, Y, Z errors.

use crate::mac::mac_0mul;
use crate::trit::Trit;

// ----------------------------------------------------------------------------
// 1. 3-Qubit Bit-Flip Code [[3, 1, 1]]
// ----------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Correction3 {
    None,
    FlipQ0,
    FlipQ1,
    FlipQ2,
}

pub struct BitFlip3Code;

impl BitFlip3Code {
    /// Compute 2-bit syndrome from 3 measured binary values (0 or 1).
    /// s0 = m0 ^ m1, s1 = m1 ^ m2.
    #[inline]
    pub fn hard_syndrome(m: [u8; 3]) -> (u8, u8) {
        let s0 = (m[0] ^ m[1]) & 1;
        let s1 = (m[1] ^ m[2]) & 1;
        (s0, s1)
    }

    /// Decode syndrome into physical correction action.
    #[inline]
    pub fn decode_syndrome(s0: u8, s1: u8) -> Correction3 {
        match (s0, s1) {
            (0, 0) => Correction3::None,
            (1, 0) => Correction3::FlipQ0,
            (1, 1) => Correction3::FlipQ1,
            (0, 1) => Correction3::FlipQ2,
            _ => Correction3::None,
        }
    }

    /// Soft-decision syndrome extraction using 0-MUL Sign-Select.
    /// In superconducting/spin QPU readout, analog IQ voltages are digitized to signed int8 `[y0, y1, y2]`.
    /// Parity checks correspond to ternary weights:
    /// Check 0: [+1, -1, 0, 0]
    /// Check 1: [0, +1, -1, 0]
    /// Returns (s0, s1) and the intermediate parity sums.
    pub fn soft_syndrome_0mul(analog_y: [i8; 3]) -> ((u8, u8), (i32, i32)) {
        let x = [analog_y[0], analog_y[1], analog_y[2], 0];
        let w0 = [Trit::Pos, Trit::Neg, Trit::Zero, Trit::Zero];
        let w1 = [Trit::Zero, Trit::Pos, Trit::Neg, Trit::Zero];

        let out0 = mac_0mul(&x, &w0);
        let out1 = mac_0mul(&x, &w1);

        // In binary readout: sign difference indicates odd parity (error)
        let s0 = if (analog_y[0] >= 0) != (analog_y[1] >= 0) { 1 } else { 0 };
        let s1 = if (analog_y[1] >= 0) != (analog_y[2] >= 0) { 1 } else { 0 };

        ((s0, s1), (out0.y, out1.y))
    }

    /// Apply correction to 3-bit codeword.
    pub fn apply_correction(mut bits: [u8; 3], corr: Correction3) -> [u8; 3] {
        match corr {
            Correction3::None => {}
            Correction3::FlipQ0 => bits[0] ^= 1,
            Correction3::FlipQ1 => bits[1] ^= 1,
            Correction3::FlipQ2 => bits[2] ^= 1,
        }
        bits
    }
}

// ----------------------------------------------------------------------------
// 2. 5-Qubit Perfect Code [[5, 1, 3]]
// ----------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Pauli {
    I,
    X,
    Y,
    Z,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PauliError {
    pub qubit: usize, // 0..4
    pub pauli: Pauli,
}

pub struct FiveQubitCode;

impl FiveQubitCode {
    /// 4 stabilizer generators of the 5-qubit code:
    /// g0 = X Z Z X I
    /// g1 = I X Z Z X
    /// g2 = X I X Z Z
    /// g3 = Z X I X Z
    pub const GENERATORS: [[Pauli; 5]; 4] = [
        [Pauli::X, Pauli::Z, Pauli::Z, Pauli::X, Pauli::I],
        [Pauli::I, Pauli::X, Pauli::Z, Pauli::Z, Pauli::X],
        [Pauli::X, Pauli::I, Pauli::X, Pauli::Z, Pauli::Z],
        [Pauli::Z, Pauli::X, Pauli::I, Pauli::X, Pauli::Z],
    ];

    /// Check commutation between two single-qubit Paulis.
    /// Returns true if they commute, false if they anti-commute.
    #[inline]
    pub fn commutes(a: Pauli, b: Pauli) -> bool {
        match (a, b) {
            (Pauli::I, _) | (_, Pauli::I) => true,
            (x, y) if x == y => true,
            _ => false, // Different non-identity Paulis anti-commute
        }
    }

    /// Calculate 4-bit syndrome for any single-qubit Pauli error.
    /// Syndrome bit k is 1 if error anti-commutes with generator k, 0 if it commutes.
    pub fn syndrome_for_error(err: PauliError) -> u8 {
        if err.pauli == Pauli::I {
            return 0;
        }
        let mut syn = 0u8;
        for (k, gen) in Self::GENERATORS.iter().enumerate() {
            let gen_p = gen[err.qubit];
            if !Self::commutes(err.pauli, gen_p) {
                syn |= 1 << k;
            }
        }
        syn
    }

    /// Decode 4-bit syndrome into identified Pauli error.
    /// Returns None if syndrome is 0 (no error), or Some(PauliError).
    pub fn decode_syndrome(syn: u8) -> Option<PauliError> {
        if syn == 0 {
            return None;
        }
        // Search through all 15 possible single-qubit errors
        for q in 0..5 {
            for &p in &[Pauli::X, Pauli::Y, Pauli::Z] {
                let candidate = PauliError { qubit: q, pauli: p };
                if Self::syndrome_for_error(candidate) == syn {
                    return Some(candidate);
                }
            }
        }
        None
    }
}
