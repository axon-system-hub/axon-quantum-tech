//! Rotated [[9,1,3]] CSS code, contract surface-d3/v2.
//!
//! Data index is row-major 0..8. X and Z checks overlap on an even number
//! of data qubits. Boundary checks have weight 2. Syndromes can be degenerate:
//! a correction must be equivalent modulo stabilizers, not necessarily equal
//! to the injected error. This is an ideal one-round reference, not a
//! measurement-noise decoder, syndrome extraction circuit or physical QPU.

use crate::qec::Pauli;
pub const SURFACE_DATA_QUBITS: usize = 9;
pub const SURFACE_Z_CHECKS: usize = 4;
pub const SURFACE_X_CHECKS: usize = 4;
// bit q denotes data qubit q; bit k of syndrome denotes check k.
pub const Z_CHECK_MASKS: [u16; 4] = [0b000110110, 0b011011000, 0b000001001, 0b100100000];
pub const X_CHECK_MASKS: [u16; 4] = [0b000011011, 0b110110000, 0b000000110, 0b011000000];

fn syndrome(mask: u16, checks: &[u16; 4]) -> u8 {
    checks.iter().enumerate().fold(0, |s, (k, row)| {
        s | ((((mask & row).count_ones() & 1) as u8) << k)
    })
}
fn bits_mask(bits: &[bool; 9]) -> u16 {
    bits.iter()
        .enumerate()
        .fold(0, |m, (q, bit)| m | ((*bit as u16) << q))
}
pub fn surface_z_syndrome(x_errors: &[bool; 9]) -> u8 {
    syndrome(bits_mask(x_errors), &Z_CHECK_MASKS)
}
pub fn surface_x_syndrome(z_errors: &[bool; 9]) -> u8 {
    syndrome(bits_mask(z_errors), &X_CHECK_MASKS)
}

/// Minimum-weight correction in a single CSS sector; ties use lowest mask.
/// Every 4-bit syndrome is valid, but only weight <= 1 Pauli faults are guaranteed.
pub fn minimum_surface_correction(syn: u8, checks: &[u16; 4]) -> Result<u16, String> {
    if syn > 15 {
        return Err("surface syndrome exceeds 4 bits".into());
    }
    (0u16..512)
        .filter(|m| syndrome(*m, checks) == syn)
        .min_by_key(|m| (m.count_ones(), *m))
        .ok_or_else(|| "unreachable syndrome".into())
}

/// Legacy helper now refers only to Z checks (X correction). A shared X/Z
/// lookup is invalid for this CSS code. Use try_decode_surface_d3 instead.
#[deprecated(note = "sector-specific syndromes; use try_decode_surface_d3")]
pub fn decode_surface_syndrome_to_qubit(syn: u8) -> Option<usize> {
    let mask = minimum_surface_correction(syn, &Z_CHECK_MASKS).ok()?;
    if mask.count_ones() == 1 {
        Some(mask.trailing_zeros() as usize)
    } else {
        None
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SurfaceCorrection {
    pub qubit: usize,
    pub op: Pauli,
}

pub fn try_decode_surface_d3(z_syn: u8, x_syn: u8) -> Result<Vec<SurfaceCorrection>, String> {
    let xm = minimum_surface_correction(z_syn, &Z_CHECK_MASKS)?;
    let zm = minimum_surface_correction(x_syn, &X_CHECK_MASKS)?;
    Ok((0..9)
        .filter_map(|q| match ((xm >> q) & 1, (zm >> q) & 1) {
            (1, 0) => Some(SurfaceCorrection {
                qubit: q,
                op: Pauli::X,
            }),
            (0, 1) => Some(SurfaceCorrection {
                qubit: q,
                op: Pauli::Z,
            }),
            (1, 1) => Some(SurfaceCorrection {
                qubit: q,
                op: Pauli::Y,
            }),
            _ => None,
        })
        .collect())
}
pub fn decode_surface_d3(z_syn: u8, x_syn: u8) -> Vec<SurfaceCorrection> {
    try_decode_surface_d3(z_syn, x_syn).expect("invalid surface-d3/v2 syndrome")
}
