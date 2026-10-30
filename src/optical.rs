//! Optical (MZI/PCM) ternary GEMV model, following the signal model of
//! AXON-PAT-34 (`axon_optical_cpnpu_v4_simulator.py`):
//!   +1 -> phase 0, -1 -> phase pi, 0 -> residual leakage 10^(-ER/20).
//! Extra non-idealities added here: Gaussian phase error per cell and additive
//! detector noise. Everything is a *model*; no optical or cryogenic measurement.

use crate::rng::Rng;

pub struct OpticalParams {
    /// MZI extinction ratio for the 0 state (dB). Patent text: >= 40-45 dB.
    pub extinction_db: f64,
    /// Std-dev of per-cell phase error (radians).
    pub phase_sigma: f64,
    /// Std-dev of additive detector noise relative to ||y_ideal||/sqrt(M).
    pub detector_noise_rel: f64,
}

pub struct OpticalResult {
    pub rel_l2_error: f64,
    pub cosine: f64,
}

fn gauss(r: &mut Rng) -> f64 {
    let u1 = (r.next_u64() >> 11) as f64 / (1u64 << 53) as f64;
    let u2 = (r.next_u64() >> 11) as f64 / (1u64 << 53) as f64;
    (-2.0 * (u1.max(1e-300)).ln()).sqrt() * (2.0 * std::f64::consts::PI * u2).cos()
}

/// Random ternary matrix (row-major, m x n) with the given zero fraction.
pub fn random_trit_matrix(r: &mut Rng, m: usize, n: usize, zero_frac: f64) -> Vec<i8> {
    (0..m * n)
        .map(|_| {
            if (r.below(1_000_000) as f64) < zero_frac * 1e6 {
                0
            } else if r.below(2) == 0 {
                1
            } else {
                -1
            }
        })
        .collect()
}

/// Run one optical GEMV and compare against the exact digital (0-MUL) result.
pub fn optical_gemv(w: &[i8], m: usize, n: usize, x: &[f64], p: &OpticalParams, r: &mut Rng) -> OpticalResult {
    let leak = 10f64.powf(-p.extinction_db / 20.0);
    let mut ideal = vec![0.0f64; m];
    let mut meas = vec![0.0f64; m];
    for i in 0..m {
        let (mut yi, mut ym) = (0.0, 0.0);
        for j in 0..n {
            let wij = w[i * n + j];
            // Ideal digital 0-MUL: skip / add / subtract.
            match wij {
                1 => yi += x[j],
                -1 => yi -= x[j],
                _ => {}
            }
            // Optical amplitude transmission with phase error.
            let ph = gauss(r) * p.phase_sigma;
            let t = match wij {
                1 => ph.cos(),
                -1 => -ph.cos(),
                _ => leak * ph.cos(),
            };
            ym += t * x[j];
        }
        ideal[i] = yi;
        meas[i] = ym;
    }
    let rms = (ideal.iter().map(|v| v * v).sum::<f64>() / m as f64).sqrt();
    for v in meas.iter_mut() {
        *v += gauss(r) * p.detector_noise_rel * rms;
    }
    let (mut dot, mut ni, mut nm, mut err) = (0.0, 0.0, 0.0, 0.0);
    for i in 0..m {
        dot += ideal[i] * meas[i];
        ni += ideal[i] * ideal[i];
        nm += meas[i] * meas[i];
        err += (ideal[i] - meas[i]).powi(2);
    }
    OpticalResult {
        rel_l2_error: (err / ni.max(1e-300)).sqrt(),
        cosine: dot / (ni.sqrt() * nm.sqrt()).max(1e-300),
    }
}

