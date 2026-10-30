use axon_quantum_tech::qec::{BitFlip3Code, Correction3, FiveQubitCode, Pauli, PauliError};
use axon_quantum_tech::rng::Rng;

#[test]
fn test_3qubit_bitflip_exhaustive_single_error_correction() {
    // Both logical states: 000 and 111
    for logical_bit in [0u8, 1u8] {
        let original = [logical_bit, logical_bit, logical_bit];

        // 1. No error case
        let (s0, s1) = BitFlip3Code::hard_syndrome(original);
        assert_eq!((s0, s1), (0, 0));
        let corr = BitFlip3Code::decode_syndrome(s0, s1);
        assert_eq!(corr, Correction3::None);
        assert_eq!(BitFlip3Code::apply_correction(original, corr), original);

        // 2. All 3 single-bit error cases
        for error_pos in 0..3 {
            let mut noisy = original;
            noisy[error_pos] ^= 1;

            let (s0, s1) = BitFlip3Code::hard_syndrome(noisy);
            let corr = BitFlip3Code::decode_syndrome(s0, s1);

            let expected_corr = match error_pos {
                0 => Correction3::FlipQ0,
                1 => Correction3::FlipQ1,
                2 => Correction3::FlipQ2,
                _ => unreachable!(),
            };
            assert_eq!(corr, expected_corr, "Failed for error_pos {}", error_pos);

            let corrected = BitFlip3Code::apply_correction(noisy, corr);
            assert_eq!(corrected, original, "Correction failed for error_pos {}", error_pos);
        }
    }
}

#[test]
fn test_3qubit_soft_syndrome_0mul_matches_hard_syndrome() {
    let mut rng = Rng::new(42);
    for _ in 0..10_000 {
        // Generate random analog voltages for qubits: positive -> 0, negative -> 1
        let a0 = (rng.below(255) as i16 - 128) as i8;
        let a1 = (rng.below(255) as i16 - 128) as i8;
        let a2 = (rng.below(255) as i16 - 128) as i8;

        let b0 = if a0 >= 0 { 0u8 } else { 1u8 };
        let b1 = if a1 >= 0 { 0u8 } else { 1u8 };
        let b2 = if a2 >= 0 { 0u8 } else { 1u8 };

        let hard_syn = BitFlip3Code::hard_syndrome([b0, b1, b2]);
        let (soft_syn, (diff0, diff1)) = BitFlip3Code::soft_syndrome_0mul([a0, a1, a2]);

        assert_eq!(soft_syn, hard_syn);
        assert_eq!(diff0, a0 as i32 - a1 as i32);
        assert_eq!(diff1, a1 as i32 - a2 as i32);
    }
}

#[test]
fn test_5qubit_code_all_15_single_qubit_paulis_are_uniquely_identified() {
    let mut syndromes_seen = std::collections::HashSet::new();

    // 15 single-qubit errors: 5 qubits x 3 non-identity Paulis
    let mut count = 0;
    for q in 0..5 {
        for &p in &[Pauli::X, Pauli::Y, Pauli::Z] {
            let err = PauliError { qubit: q, pauli: p };
            let syn = FiveQubitCode::syndrome_for_error(err);

            assert_ne!(syn, 0, "Non-identity Pauli error must produce non-zero syndrome");
            assert!(syn < 16, "Syndrome must fit in 4 bits");

            // Must be uniquely decodable
            let decoded = FiveQubitCode::decode_syndrome(syn);
            assert_eq!(decoded, Some(err), "Syndrome {:#06b} failed to decode correctly", syn);

            syndromes_seen.insert(syn);
            count += 1;
        }
    }

    assert_eq!(count, 15);
    assert_eq!(
        syndromes_seen.len(),
        15,
        "All 15 single-qubit Pauli errors must yield distinct syndromes (1-to-1 bijection)"
    );
}

#[test]
fn test_qec_error_suppression_monte_carlo() {
    let p_phys = 0.05; // 5% physical bit-flip error rate
    let trials = 100_000;
    let mut rng = Rng::new(12345);

    let mut uncorrected_errors = 0;
    let mut post_qec_errors = 0;

    for _ in 0..trials {
        let orig = [0u8, 0u8, 0u8];
        let mut noisy = orig;

        for bit in noisy.iter_mut() {
            if (rng.below(10_000) as f64 / 10_000.0) < p_phys {
                *bit ^= 1;
            }
        }

        // Without QEC: majority voting on raw noisy bits or single qubit error
        if noisy[0] != 0 {
            uncorrected_errors += 1;
        }

        // With 3-qubit QEC decoding
        let (s0, s1) = BitFlip3Code::hard_syndrome(noisy);
        let corr = BitFlip3Code::decode_syndrome(s0, s1);
        let corrected = BitFlip3Code::apply_correction(noisy, corr);

        // Logical error occurs if 2 or more bits were flipped (distance-3 code fails at weight >= 2)
        if corrected[0] != 0 {
            post_qec_errors += 1;
        }
    }

    let uncorr_rate = uncorrected_errors as f64 / trials as f64;
    let qec_rate = post_qec_errors as f64 / trials as f64;

    println!("\n[QEC Monte Carlo 100,000 trials]");
    println!("Physical error rate (target p=0.05): {:.4}", uncorr_rate);
    println!("Logical error rate post-QEC:         {:.4}", qec_rate);

    // Theory: P_logical ~ 3*p^2 = 3 * (0.05)^2 = 0.0075 (~0.75%)
    assert!(
        qec_rate < uncorr_rate * 0.25,
        "QEC must reduce error by at least 4x at p=0.05"
    );
    assert!(
        (qec_rate - 0.0075).abs() < 0.002,
        "Measured logical error rate {:.4} matches 3*p^2 theoretical prediction",
        qec_rate
    );
}

#[test]
fn test_5qubit_non_css_transversal_cnot_stabilizer_leakage_counterexample() {
    // Audit Verification (AXON-PAT-36 Claim 6):
    // Under bitwise CNOT_{C -> T}, X_C (x) I_T -> X_C (x) X_T and Z_C (x) I_T -> Z_C (x) I_T.
    // Therefore, applying naive bitwise transversal CNOT^{\otimes 5} to generator g0 = X Z Z X I on Control
    // induces the operator P_T = X I I X I on the Target [[5, 1, 3]] block.
    let g0_control = FiveQubitCode::GENERATORS[0]; // [X, Z, Z, X, I]
    let induced_target: [Pauli; 5] = g0_control.map(|p| match p {
        Pauli::X | Pauli::Y => Pauli::X,
        Pauli::I | Pauli::Z => Pauli::I,
    });
    assert_eq!(
        induced_target,
        [Pauli::X, Pauli::I, Pauli::I, Pauli::X, Pauli::I],
        "Bitwise CNOT maps (XZZXI)_C (x) I_T to (XZZXI)_C (x) (XIIXI)_T"
    );

    // Check commutation of induced_target (XIIXI) with target stabilizer g1 = IXZZX:
    let g1_target = FiveQubitCode::GENERATORS[1]; // [I, X, Z, Z, X]
    let mut anticommute_positions = 0;
    for i in 0..5 {
        if !FiveQubitCode::commutes(induced_target[i], g1_target[i]) {
            anticommute_positions += 1;
        }
    }
    // Odd number of anti-commuting single-qubit positions (specifically qubit 3: X vs Z)
    // proves that (XIIXI)_T anti-commutes with g1 = IXZZX and thus leaves the [[5, 1, 3]] code space!
    assert_eq!(anticommute_positions, 1);
    assert_eq!(
        anticommute_positions % 2,
        1,
        "Induced target operator XIIXI anti-commutes with stabilizer g1 = IXZZX; naive transversal CNOT does not preserve [[5, 1, 3]] code space"
    );
}
