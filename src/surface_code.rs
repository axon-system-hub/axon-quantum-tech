//! Rotated Surface Code (distance d=3) with AXON 0-MUL Syndrome Parity Engine.
//!
//! # Architecture:
//! - 9 Data Qubits (D0 .. D8) arranged on a 3x3 2D planar lattice:
//!   D0 (0,0)  --  D1 (0,1)  --  D2 (0,2)
//!      |             |             |
//!   D3 (1,0)  --  D4 (1,1)  --  D5 (1,2)
//!      |             |             |
//!   D6 (2,0)  --  D7 (2,1)  --  D8 (2,2)
//!
//! - 4 Z-Plaquette Checks (detect X bit-flip errors):
//!   * Z0: D0 ^ D1 ^ D3 ^ D4  (Top-Left)
//!   * Z1: D1 ^ D2 ^ D4 ^ D5  (Top-Right)
//!   * Z2: D3 ^ D4 ^ D6 ^ D7  (Bottom-Left)
//!   * Z3: D4 ^ D5 ^ D7 ^ D8  (Bottom-Right)
//!
//! - 4 X-Plaquette Checks (detect Z phase-flip errors):
//!   * X0: D0 ^ D1 ^ D3 ^ D4  (Top-Left)
//!   * X1: D1 ^ D2 ^ D4 ^ D5  (Top-Right)
//!   * X2: D3 ^ D4 ^ D6 ^ D7  (Bottom-Left)
//!   * X3: D4 ^ D5 ^ D7 ^ D8  (Bottom-Right)
//!
//! Every single-qubit error produces an injective, unique 4-bit syndrome:
//!   D0: 0b0001 (1)
//!   D1: 0b0011 (3)
//!   D2: 0b0010 (2)
//!   D3: 0b0101 (5)
//!   D4: 0b1111 (15)
//!   D5: 0b1010 (10)
//!   D6: 0b0100 (4)
//!   D7: 0b1100 (12)
//!   D8: 0b1000 (8)
//!
//! Single-cycle combinational 0-MUL decoder with 0 multipliers.

use crate::qec::Pauli;

pub const SURFACE_DATA_QUBITS: usize = 9;
pub const SURFACE_Z_CHECKS: usize = 4;
pub const SURFACE_X_CHECKS: usize = 4;

/// Computes the 4 Z-stabilizer syndromes from 9 binary Z-eigenvalues / error bits.
/// Returns a 4-bit bitmask: (bit 0: Z0, bit 1: Z1, bit 2: Z2, bit 3: Z3).
#[inline]
pub fn surface_z_syndrome(x_errors: &[bool; SURFACE_DATA_QUBITS]) -> u8 {
    let s0 = x_errors[0] ^ x_errors[1] ^ x_errors[3] ^ x_errors[4]; // Top-Left
    let s1 = x_errors[1] ^ x_errors[2] ^ x_errors[4] ^ x_errors[5]; // Top-Right
    let s2 = x_errors[3] ^ x_errors[4] ^ x_errors[6] ^ x_errors[7]; // Bottom-Left
    let s3 = x_errors[4] ^ x_errors[5] ^ x_errors[7] ^ x_errors[8]; // Bottom-Right

    (s0 as u8) | ((s1 as u8) << 1) | ((s2 as u8) << 2) | ((s3 as u8) << 3)
}

/// Computes the 4 X-stabilizer syndromes from 9 binary X-eigenvalues / error bits.
/// Returns a 4-bit bitmask: (bit 0: X0, bit 1: X1, bit 2: X2, bit 3: X3).
#[inline]
pub fn surface_x_syndrome(z_errors: &[bool; SURFACE_DATA_QUBITS]) -> u8 {
    let s0 = z_errors[0] ^ z_errors[1] ^ z_errors[3] ^ z_errors[4]; // Top-Left
    let s1 = z_errors[1] ^ z_errors[2] ^ z_errors[4] ^ z_errors[5]; // Top-Right
    let s2 = z_errors[3] ^ z_errors[4] ^ z_errors[6] ^ z_errors[7]; // Bottom-Left
    let s3 = z_errors[4] ^ z_errors[5] ^ z_errors[7] ^ z_errors[8]; // Bottom-Right

    (s0 as u8) | ((s1 as u8) << 1) | ((s2 as u8) << 2) | ((s3 as u8) << 3)
}

/// Maps 4-bit syndrome to the identified single error qubit (0..8)
#[inline]
pub fn decode_surface_syndrome_to_qubit(syndrome: u8) -> Option<usize> {
    match syndrome {
        0b0001 => Some(0),  // D0
        0b0011 => Some(1),  // D1
        0b0010 => Some(2),  // D2
        0b0101 => Some(3),  // D3
        0b1111 => Some(4),  // D4 (center qubit touches all 4 plaquettes)
        0b1010 => Some(5),  // D5
        0b0100 => Some(6),  // D6
        0b1100 => Some(7),  // D7
        0b1000 => Some(8),  // D8
        _ => None,
    }
}

/// Rotated Surface Code Full Syndrome Decoder (combined X and Z syndrome)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SurfaceCorrection {
    pub qubit: usize,
    pub op: Pauli,
}

/// Decodes full 8-bit syndrome (4 Z-checks for X errors, 4 X-checks for Z errors).
pub fn decode_surface_d3(z_syndrome: u8, x_syndrome: u8) -> Vec<SurfaceCorrection> {
    let mut corrections = Vec::new();

    let x_err_qubit = decode_surface_syndrome_to_qubit(z_syndrome);
    let z_err_qubit = decode_surface_syndrome_to_qubit(x_syndrome);

    match (x_err_qubit, z_err_qubit) {
        (Some(qx), Some(qz)) if qx == qz => {
            // Both X and Z error on same qubit => Pauli Y error
            corrections.push(SurfaceCorrection { qubit: qx, op: Pauli::Y });
        }
        (Some(qx), Some(qz)) => {
            corrections.push(SurfaceCorrection { qubit: qx, op: Pauli::X });
            corrections.push(SurfaceCorrection { qubit: qz, op: Pauli::Z });
        }
        (Some(qx), None) => {
            corrections.push(SurfaceCorrection { qubit: qx, op: Pauli::X });
        }
        (None, Some(qz)) => {
            corrections.push(SurfaceCorrection { qubit: qz, op: Pauli::Z });
        }
        (None, None) => {}
    }

    corrections
}
