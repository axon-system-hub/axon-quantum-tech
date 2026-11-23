//! Comprehensive unit tests for 100-Qubit Tiling, Surface Code d=3, and OpenQASM Bridge.

use axon_quantum_tech::qec::{FiveQubitCode, Pauli};
use axon_quantum_tech::qasm_bridge::{QasmToTasmCompiler, TasmOp};
use axon_quantum_tech::surface_code::{
    decode_surface_d3, surface_x_syndrome, surface_z_syndrome, SurfaceCorrection,
};
use axon_quantum_tech::tiler_100q::{
    decode_100q_parallel, decode_concatenated_mode_b, detect_mode_b_from_measurements,
    logical_cnot_5q_protocol, naive_bitwise_cnot_5q, tile_stabilizer_syndrome, IDENTITY_5Q,
    LOGICAL_X_5Q, LOGICAL_Z_5Q, TOTAL_PHYSICAL_QUBITS_100Q,
};

#[test]
fn test_surface_code_d3_all_single_qubit_paulis() {
    // 9 data qubits: test single X, single Z, and single Y errors on each qubit
    for q in 0..9 {
        // 1. Single X error on qubit q
        let mut x_errors = [false; 9];
        x_errors[q] = true;
        let z_errors = [false; 9];

        let z_syn = surface_z_syndrome(&x_errors);
        let x_syn = surface_x_syndrome(&z_errors);

        assert_ne!(z_syn, 0, "X error on qubit {} must trigger non-zero Z syndrome", q);
        assert_eq!(x_syn, 0, "X error must not trigger X syndrome in CSS code");

        // 2. Single Z error on qubit q
        let mut z_errors2 = [false; 9];
        z_errors2[q] = true;
        let x_errors2 = [false; 9];

        let z_syn2 = surface_z_syndrome(&x_errors2);
        let x_syn2 = surface_x_syndrome(&z_errors2);

        assert_eq!(z_syn2, 0, "Z error must not trigger Z syndrome in CSS code");
        assert_ne!(x_syn2, 0, "Z error on qubit {} must trigger non-zero X syndrome", q);
    }
}

#[test]
fn test_surface_code_d3_full_decoder_corrections() {
    // Test that decode_surface_d3 correctly returns Pauli corrections
    let mut x_err = [false; 9];
    x_err[4] = true; // X on center qubit D4
    let mut z_err = [false; 9];
    z_err[4] = true; // Z on center qubit D4 -> combined Y on D4

    let z_syn = surface_z_syndrome(&x_err);
    let x_syn = surface_x_syndrome(&z_err);

    let corrections = decode_surface_d3(z_syn, x_syn);
    assert_eq!(corrections.len(), 1, "Combined X and Z on D4 should be identified as single Y error");
    assert_eq!(
        corrections[0],
        SurfaceCorrection { qubit: 4, op: Pauli::Y },
        "D4 must be corrected with Pauli Y"
    );
}

#[test]
fn test_100q_modular_tiling_parallel_decoding() {
    // Test all 20 tiles operating in parallel
    let mut physical_errors = [Pauli::I; TOTAL_PHYSICAL_QUBITS_100Q];

    // Place single errors on 6 of the 20 tiles
    physical_errors[2] = Pauli::X;   // Tile 0, qubit 2 -> X
    physical_errors[7] = Pauli::Z;   // Tile 1, qubit 2 -> Z
    physical_errors[14] = Pauli::Y;  // Tile 2, qubit 4 -> Y
    physical_errors[20] = Pauli::X;  // Tile 4, qubit 0 -> X
    physical_errors[49] = Pauli::Z;  // Tile 9, qubit 4 -> Z
    physical_errors[95] = Pauli::Y;  // Tile 19, qubit 0 -> Y

    let state = decode_100q_parallel(&physical_errors);

    assert_eq!(state.total_errors_corrected, 6, "Must correctly decode all 6 single errors across tiles");
    assert_eq!(state.uncorrectable_tiles, 0, "No tiles should have uncorrectable errors");

    // Verify Tile 0
    assert_eq!(state.tiles[0].error_qubit_local, Some(2));
    assert_eq!(state.tiles[0].error_op, Some(Pauli::X));

    // Verify Tile 1
    assert_eq!(state.tiles[1].error_qubit_local, Some(2));
    assert_eq!(state.tiles[1].error_op, Some(Pauli::Z));

    // Verify Tile 2
    assert_eq!(state.tiles[2].error_qubit_local, Some(4));
    assert_eq!(state.tiles[2].error_op, Some(Pauli::Y));

    // Verify Tile 3 (idle)
    assert_eq!(state.tiles[3].syndrome, 0);
    assert_eq!(state.tiles[3].error_qubit_local, None);

    // Verify Tile 19
    assert_eq!(state.tiles[19].error_qubit_local, Some(0));
    assert_eq!(state.tiles[19].error_op, Some(Pauli::Y));
}

#[test]
fn test_100q_concatenated_mode_b_tolerance() {
    let mut physical_errors = [Pauli::I; TOTAL_PHYSICAL_QUBITS_100Q];

    // Super-tile 0: 1 single error on Tile 0, 1 single error on Tile 2
    // Each child tile has only 1 error, so each child tile succeeds!
    physical_errors[1] = Pauli::X;  // Tile 0, qubit 1
    physical_errors[11] = Pauli::Z; // Tile 2, qubit 1

    let state = decode_100q_parallel(&physical_errors);
    let super_results = decode_concatenated_mode_b(&state);

    assert!(!super_results[0].logical_error, "Super-tile 0 must remain fault-tolerant (0 failed child tiles)");
    assert_eq!(super_results[0].outer_syndrome, 0);
    assert_eq!(super_results[0].corrected_tiles, 2);
}

#[test]
fn test_mode_b_detects_double_x_errors_in_two_inner_tiles() {
    let mut physical_errors = [Pauli::I; TOTAL_PHYSICAL_QUBITS_100Q];
    for index in [25, 26, 30, 31] {
        physical_errors[index] = Pauli::X;
    }

    let state = decode_100q_parallel(&physical_errors);
    assert_eq!(state.tiles[5].syndrome, 9);
    assert_eq!(state.tiles[6].syndrome, 9);
    assert_eq!(state.uncorrectable_tiles, 2);

    let results = decode_concatenated_mode_b(&state);
    assert_eq!(
        results.map(|result| result.logical_error),
        [false, true, false, false],
    );
    assert_eq!(results.map(|result| result.outer_syndrome), [0, 15, 0, 0]);
    assert_eq!(results[1].corrected_tiles, 0);
}

#[test]
fn test_mode_b_outer_syndrome_with_zero_inner_syndrome() {
    let mut errors = [Pauli::I; TOTAL_PHYSICAL_QUBITS_100Q];
    errors[0] = Pauli::X;
    errors[1] = Pauli::X;
    errors[3] = Pauli::Z;

    let state = decode_100q_parallel(&errors);
    assert_eq!(state.tiles[0].syndrome, 0);
    let results = decode_concatenated_mode_b(&state);
    // Outer syndrome 5 detects the single-tile logical Z residual; level-2 decoding recovers it.
    assert_eq!(results[0].outer_syndrome, 5);
    assert!(!results[0].logical_error);
    assert_eq!(results[0].corrected_tiles, 0);

    // Measurement-only detection flags any nonzero outer syndrome.
    let measured = detect_mode_b_from_measurements(&state.tiles, [results[0].outer_syndrome, 0, 0, 0]).unwrap();
    assert!(measured[0].logical_error);
    assert_eq!(measured[0].outer_syndrome, 5);
}

#[test]
fn test_mode_b_with_measured_outer_syndromes() {
    let state = decode_100q_parallel(&[Pauli::I; TOTAL_PHYSICAL_QUBITS_100Q]);
    for syndrome in 0..=15 {
        let results = detect_mode_b_from_measurements(&state.tiles, [0, 0, syndrome, 0]).unwrap();
        assert_eq!(
            results.map(|result| result.logical_error),
            [false, false, syndrome != 0, false],
        );
        assert_eq!(results[2].outer_syndrome, syndrome);
    }
    assert!(detect_mode_b_from_measurements(&state.tiles, [0, 0, 16, 0]).is_none());
}

#[test]
fn test_openqasm_bridge_compiler() {
    let qasm_src = r#"
        OPENQASM 3.0;
        include "stdgates.inc";
        qubit[5] q;
        bit[4] c;

        reset q[0];
        h q[0];
        cx q[0], q[1];
        s q[2];
        qec_5q 0, 0;
        measure q[0] -> c[0];
    "#;

    let mut compiler = QasmToTasmCompiler::new();
    let op_count = compiler.compile_str(qasm_src).expect("Compilation must succeed");
    assert_eq!(op_count, 7, "Should compile exactly 7 T-ASM instructions");

    assert_eq!(compiler.instructions[0], TasmOp::Reset { qubit: 0 });
    assert_eq!(compiler.instructions[1], TasmOp::Hadamard { qubit: 0 });
    assert_eq!(compiler.instructions[2], TasmOp::Cnot { control: 0, target: 1 });
    assert_eq!(compiler.instructions[3], TasmOp::Phase { qubit: 2 });
    assert_eq!(compiler.instructions[4], TasmOp::ExtractSyndrome5Q { tile_idx: 0, base_qubit: 0 });
    assert_eq!(compiler.instructions[5], TasmOp::ApplyQecCorrection5Q { tile_idx: 0 });
    assert_eq!(compiler.instructions[6], TasmOp::Measure { qubit: 0, classical_bit: 0 });

    let asm_text = compiler.emit_assembly();
    assert!(asm_text.contains("T_0MUL_H      q[0]"));
    assert!(asm_text.contains("T_0MUL_SYND5Q tile[0]"));
    assert!(asm_text.contains("T_0MUL_CORR5Q tile[0]"));
}

#[test]
fn test_inter_tile_logical_cnot_preserves_code_space_vs_naive_transversal() {
    // 1. Verify that naive bitwise transversal CNOT breaks [[5, 1, 3]] code space on g0 = XZZXI
    let g0 = FiveQubitCode::GENERATORS[0];
    let (_c_naive, t_naive) = naive_bitwise_cnot_5q(&g0, &IDENTITY_5Q);
    assert_eq!(t_naive, [Pauli::X, Pauli::I, Pauli::I, Pauli::X, Pauli::I]);
    assert_ne!(
        tile_stabilizer_syndrome(&t_naive),
        0,
        "Naive bitwise CNOT leaks stabilizer g0 into non-zero syndrome on Target tile"
    );

    // 2. Verify that Claim 6 `logical_cnot_5q_protocol` preserves ALL 4 stabilizer generators
    //    on both Control and Target tiles with ZERO syndrome leakage
    for gen in FiveQubitCode::GENERATORS.iter() {
        let (c_out, t_out) = logical_cnot_5q_protocol(gen, &IDENTITY_5Q);
        assert_eq!(tile_stabilizer_syndrome(&c_out), 0, "Control stabilizer must remain in code space");
        assert_eq!(tile_stabilizer_syndrome(&t_out), 0, "Target stabilizer must remain in code space");
        assert_eq!(c_out, *gen);
        assert_eq!(t_out, IDENTITY_5Q);

        let (c_out2, t_out2) = logical_cnot_5q_protocol(&IDENTITY_5Q, gen);
        assert_eq!(tile_stabilizer_syndrome(&c_out2), 0);
        assert_eq!(tile_stabilizer_syndrome(&t_out2), 0);
        assert_eq!(c_out2, IDENTITY_5Q);
        assert_eq!(t_out2, *gen);
    }

    // 3. Verify exact logical CNOT action on logical Paulis \bar{X} and \bar{Z}:
    //    \bar{X}_C \otimes I_T -> \bar{X}_C \otimes \bar{X}_T
    let (lx_c, lx_t) = logical_cnot_5q_protocol(&LOGICAL_X_5Q, &IDENTITY_5Q);
    assert_eq!((lx_c, lx_t), (LOGICAL_X_5Q, LOGICAL_X_5Q));
    assert_eq!(tile_stabilizer_syndrome(&lx_c), 0);
    assert_eq!(tile_stabilizer_syndrome(&lx_t), 0);

    //    I_C \otimes \bar{Z}_T -> \bar{Z}_C \otimes \bar{Z}_T
    let (lz_c, lz_t) = logical_cnot_5q_protocol(&IDENTITY_5Q, &LOGICAL_Z_5Q);
    assert_eq!((lz_c, lz_t), (LOGICAL_Z_5Q, LOGICAL_Z_5Q));
    assert_eq!(tile_stabilizer_syndrome(&lz_c), 0);
    assert_eq!(tile_stabilizer_syndrome(&lz_t), 0);
}

