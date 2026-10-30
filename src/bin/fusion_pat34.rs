//! Fusion study: AXON-PAT-34 optical ternary GEMV vs exact 0-MUL digital result.
//! Question: how precise must the optical analog path be (extinction ratio,
//! phase error, detector noise) to match digital 0-MUL, and what does that imply
//! for a cryogenic quantum-control datapath?

use axon_quantum_tech::optical::{optical_gemv, random_trit_matrix, OpticalParams};
use axon_quantum_tech::rng::Rng;

const M: usize = 544;
const N: usize = 2048;

fn run(zero_frac: f64, p: &OpticalParams, seed: u64) -> (f64, f64) {
    let mut r = Rng::new(seed);
    let w = random_trit_matrix(&mut r, M, N, zero_frac);
    let x: Vec<f64> = (0..N).map(|_| r.i8() as f64 / 127.0).collect();
    let o = optical_gemv(&w, M, N, &x, p, &mut r);
    (o.rel_l2_error, o.cosine)
}

fn main() {
    println!("Optical (PAT-34 model) vs digital 0-MUL, {M}x{N} ternary GEMV, 50% zeros");
    println!("MODEL ONLY: no optical/cryogenic measurement.\n");

    println!("[A] Extinction ratio sweep (no phase error, no detector noise)");
    println!("{:>8} | {:>12} {:>12}", "ER dB", "rel L2 err", "cosine");
    for er in [10.0, 20.0, 30.0, 40.0, 45.0] {
        let p = OpticalParams { extinction_db: er, phase_sigma: 0.0, detector_noise_rel: 0.0 };
        let (e, c) = run(0.5, &p, 1);
        println!("{:>8.0} | {:>12.2e} {:>12.8}", er, e, c);
    }

    println!("\n[B] Phase error sweep (ER = 45 dB, no detector noise)");
    println!("{:>10} | {:>12} {:>12}", "sigma rad", "rel L2 err", "cosine");
    for s in [0.0, 0.01, 0.03, 0.1, 0.3] {
        let p = OpticalParams { extinction_db: 45.0, phase_sigma: s, detector_noise_rel: 0.0 };
        let (e, c) = run(0.5, &p, 2);
        println!("{:>10.2} | {:>12.2e} {:>12.8}", s, e, c);
    }

    println!("\n[C] Detector noise sweep (ER = 45 dB, phase sigma = 0.03)");
    println!("{:>10} | {:>12} {:>12}", "noise rel", "rel L2 err", "cosine");
    for nz in [0.0, 0.001, 0.01, 0.05] {
        let p = OpticalParams { extinction_db: 45.0, phase_sigma: 0.03, detector_noise_rel: nz };
        let (e, c) = run(0.5, &p, 3);
        println!("{:>10.3} | {:>12.2e} {:>12.8}", nz, e, c);
    }

    println!("\n[D] Zero-fraction sweep (ER = 45 dB, phase sigma = 0.03)");
    println!("{:>8} | {:>12} {:>12}", "zero%", "rel L2 err", "cosine");
    for z in [0.0, 0.5, 0.9] {
        let p = OpticalParams { extinction_db: 45.0, phase_sigma: 0.03, detector_noise_rel: 0.0 };
        let (e, c) = run(z, &p, 4);
        println!("{:>8.0} | {:>12.2e} {:>12.8}", z * 100.0, e, c);
    }
}

