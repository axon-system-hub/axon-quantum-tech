use axon_quantum_tech::qasm_bridge::QasmToTasmCompiler;
use axon_quantum_tech::surface_code::{surface_x_syndrome, surface_z_syndrome};

#[test]
fn qasm_never_silently_discards_instructions() {
    for bad in [
        "t q[0];",
        "if (c[0]) x q[0];",
        "measure q[0];",
        "qec_5q nonsense;",
    ] {
        let mut c = QasmToTasmCompiler::new();
        let src = format!("OPENQASM 3.0;\nqubit[2] q;\nbit[2] c;\n{bad}\n");
        assert!(c.compile_str(&src).is_err(), "silently accepted: {bad}");
    }
}

#[test]
fn qasm_is_transactional_and_replaces_old_program() {
    let mut c = QasmToTasmCompiler::new();
    let good = "OPENQASM 3.0; qubit[1] q; h q[0];";
    c.compile_str(good).unwrap();
    let before = c.instructions.clone();
    assert!(c
        .compile_str("OPENQASM 3.0; qubit[1] q; x q[0]; garbage q[0];")
        .is_err());
    assert_eq!(c.instructions, before);
    c.compile_str(good).unwrap();
    assert_eq!(c.instructions.len(), 1);
    for bad in [
        "OPENQASM 2.0; qubit[1] q;",
        "OPENQASM 3.0; qubit[0] q;",
        "OPENQASM 3.0; qubit[1] q; h q[0]",
        "OPENQASM 3.0; include \"other.inc\"; qubit[1] q;",
    ] {
        assert!(c.compile_str(bad).is_err(), "accepted: {bad}");
    }
}

#[test]
fn surface_rank_distance_and_correction_modulo_stabilizers() {
    use axon_quantum_tech::surface_code::{
        minimum_surface_correction, X_CHECK_MASKS, Z_CHECK_MASKS,
    };
    fn span(rows: [u16; 4]) -> Vec<u16> {
        (0..16)
            .map(|v| {
                (0..4)
                    .filter(|k| v & (1 << k) != 0)
                    .fold(0, |m, k| m ^ rows[k])
            })
            .collect()
    }
    fn syn(mask: u16, rows: &[u16; 4]) -> u8 {
        rows.iter().enumerate().fold(0, |s, (k, row)| {
            s | (((mask & row).count_ones() as u8 & 1) << k)
        })
    }
    let xs = span(X_CHECK_MASKS);
    let zs = span(Z_CHECK_MASKS);
    assert_eq!(
        xs.iter()
            .copied()
            .collect::<std::collections::HashSet<_>>()
            .len(),
        16
    );
    assert_eq!(
        zs.iter()
            .copied()
            .collect::<std::collections::HashSet<_>>()
            .len(),
        16
    );
    let mut distance = 10;
    for x in 0..512u16 {
        for z in 0..512u16 {
            if syn(x, &Z_CHECK_MASKS) == 0
                && syn(z, &X_CHECK_MASKS) == 0
                && (!xs.contains(&x) || !zs.contains(&z))
            {
                distance = distance.min((x | z).count_ones());
            }
        }
    }
    assert_eq!(distance, 3);
    for q in 0..9 {
        let e = 1 << q;
        let cx = minimum_surface_correction(syn(e, &Z_CHECK_MASKS), &Z_CHECK_MASKS).unwrap();
        let cz = minimum_surface_correction(syn(e, &X_CHECK_MASKS), &X_CHECK_MASKS).unwrap();
        assert!(xs.contains(&(e ^ cx)));
        assert!(zs.contains(&(e ^ cz)));
    }
    assert!(minimum_surface_correction(16, &X_CHECK_MASKS).is_err());
}

#[test]
fn qasm_checks_registers_ranges_and_gate_arity() {
    for bad in [
        "h q[2];",
        "h r[0];",
        "h q[0] garbage;",
        "cx q[0], q[0];",
        "qec_5q 0, 0;",
    ] {
        let mut c = QasmToTasmCompiler::new();
        assert!(
            c.compile_str(&format!("OPENQASM 3.0;\nqubit[2] q;\n{bad}"))
                .is_err(),
            "accepted: {bad}"
        );
    }
}

#[test]
fn qasm3_assignment_measure_and_multiple_statements() {
    let mut c = QasmToTasmCompiler::new();
    assert_eq!(c.compile_str("OPENQASM 3.0; qubit[2] q; bit[2] c; h q[0]; cx q[0], q[1]; c[0] = measure q[0]; c[1] = measure q[1];").unwrap(), 4);
    assert_eq!(c.instructions.len(), 4);
}

#[test]
fn surface_checks_commute() {
    // Derive each support by probing the actual exported syndrome functions.
    let mut z_rows = [0u16; 4];
    let mut x_rows = [0u16; 4];
    for q in 0..9 {
        let mut error = [false; 9];
        error[q] = true;
        for k in 0..4 {
            if surface_z_syndrome(&error) & (1 << k) != 0 {
                z_rows[k] |= 1 << q;
            }
            if surface_x_syndrome(&error) & (1 << k) != 0 {
                x_rows[k] |= 1 << q;
            }
        }
    }
    for z in z_rows {
        for x in x_rows {
            assert_eq!(
                (z & x).count_ones() % 2,
                0,
                "anticommuting X={x:09b} Z={z:09b}"
            );
        }
    }
}

#[test]
fn tile_lookup_success_is_not_correction_success() {
    use axon_quantum_tech::qec::Pauli;
    use axon_quantum_tech::tiler_100q::{decode_100q_parallel, decode_concatenated_mode_b};
    // A distance-3 perfect code maps two actual faults to a wrong weight-1
    // correction. The old code reported every one as successfully corrected.
    let mut errors = [Pauli::I; 100];
    errors[0] = Pauli::X;
    errors[1] = Pauli::X;
    let state = decode_100q_parallel(&errors);
    assert!(state.tiles[0].uncorrectable_flag);
    assert_ne!(state.tiles[0].residual_logical_op, Pauli::I);
    assert_eq!(state.total_errors_corrected, 0);
    // The outer ideal code can fix one inner residual logical fault.
    assert!(!decode_concatenated_mode_b(&state)[0].logical_error);
    errors[5] = Pauli::X;
    errors[6] = Pauli::X;
    // Two failed children exhibit the limitation of the recursive decoder,
    // despite the abstract concatenated code's distance being 9.
    assert!(decode_concatenated_mode_b(&decode_100q_parallel(&errors))[0].logical_error);
}
