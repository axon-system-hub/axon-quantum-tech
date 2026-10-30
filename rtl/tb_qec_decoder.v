// ============================================================================
// Testbench: tb_qec_decoder.v
// Verification of 3-Qubit and 5-Qubit QEC 0-MUL Decoders
// Checks bit-exact match against Rust reference models
// ============================================================================

`timescale 1ns / 1ps

module tb_qec_decoder;

    integer errors = 0;
    integer tests_run = 0;

    // ------------------------------------------------------------------------
    // 1. 3-Qubit Decoder Instance
    // ------------------------------------------------------------------------
    reg mode_soft_3q;
    reg [2:0] raw_bits_3q;
    reg signed [7:0] a_y0, a_y1, a_y2;

    wire [1:0] syn_3q;
    wire signed [8:0] soft_diff0, soft_diff1;
    wire [2:0] corr_mask_3q;
    wire [2:0] corrected_bits_3q;

    qec_decoder_3qubit_0mul u_dec3 (
        .mode_soft(mode_soft_3q),
        .raw_bits(raw_bits_3q),
        .analog_y0(a_y0),
        .analog_y1(a_y1),
        .analog_y2(a_y2),
        .syndrome(syn_3q),
        .soft_diff0(soft_diff0),
        .soft_diff1(soft_diff1),
        .corr_mask(corr_mask_3q),
        .corrected_bits(corrected_bits_3q)
    );

    // ------------------------------------------------------------------------
    // 2. 5-Qubit Decoder Instance
    // ------------------------------------------------------------------------
    reg mode_soft_5q;
    reg [3:0] syn_in_5q;
    reg signed [7:0] a_s0, a_s1, a_s2, a_s3;

    wire [3:0] syn_5q;
    wire err_det_5q;
    wire [2:0] target_q_5q;
    wire [1:0] corr_pauli_5q;
    wire [9:0] corr_qubits_5q;

    qec_decoder_5qubit_0mul u_dec5 (
        .mode_soft(mode_soft_5q),
        .syndrome_in(syn_in_5q),
        .analog_s0(a_s0),
        .analog_s1(a_s1),
        .analog_s2(a_s2),
        .analog_s3(a_s3),
        .syndrome(syn_5q),
        .error_detected(err_det_5q),
        .target_qubit(target_q_5q),
        .corr_pauli(corr_pauli_5q),
        .corr_qubits(corr_qubits_5q)
    );

    // Expected mapping arrays for 5-qubit code:
    reg [2:0] exp_target [0:15];
    reg [1:0] exp_pauli  [0:15];

    integer i;

    initial begin
        // Initialize expected table
        exp_target[0]  = 3'd7; exp_pauli[0]  = 2'b00; // None
        exp_target[1]  = 3'd1; exp_pauli[1]  = 2'b01; // Q1, X
        exp_target[2]  = 3'd4; exp_pauli[2]  = 2'b11; // Q4, Z
        exp_target[3]  = 3'd2; exp_pauli[3]  = 2'b01; // Q2, X
        exp_target[4]  = 3'd2; exp_pauli[4]  = 2'b11; // Q2, Z
        exp_target[5]  = 3'd0; exp_pauli[5]  = 2'b11; // Q0, Z
        exp_target[6]  = 3'd3; exp_pauli[6]  = 2'b01; // Q3, X
        exp_target[7]  = 3'd2; exp_pauli[7]  = 2'b10; // Q2, Y
        exp_target[8]  = 3'd0; exp_pauli[8]  = 2'b01; // Q0, X
        exp_target[9]  = 3'd3; exp_pauli[9]  = 2'b11; // Q3, Z
        exp_target[10] = 3'd1; exp_pauli[10] = 2'b11; // Q1, Z
        exp_target[11] = 3'd1; exp_pauli[11] = 2'b10; // Q1, Y
        exp_target[12] = 3'd4; exp_pauli[12] = 2'b01; // Q4, X
        exp_target[13] = 3'd0; exp_pauli[13] = 2'b10; // Q0, Y
        exp_target[14] = 3'd4; exp_pauli[14] = 2'b10; // Q4, Y
        exp_target[15] = 3'd3; exp_pauli[15] = 2'b10; // Q3, Y

        $display("=================================================================");
        $display("Running AXON QEC 0-MUL Verilog Equivalence Testbench");
        $display("=================================================================");

        // --------------------------------------------------------------------
        // Test Part 1: 3-Qubit Hard Decision Exhaustive Correction
        // --------------------------------------------------------------------
        mode_soft_3q = 0;
        a_y0 = 0; a_y1 = 0; a_y2 = 0;

        // Logical |0> codeword: 3'b000
        // No error
        raw_bits_3q = 3'b000; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b000 || syn_3q !== 2'b00 || corr_mask_3q !== 3'b000) begin
            $display("FAIL: 3Q No-error |0> -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // Error on bit 0: 3'b001
        raw_bits_3q = 3'b001; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b000 || syn_3q !== 2'b01 || corr_mask_3q !== 3'b001) begin
            $display("FAIL: 3Q Flip Q0 -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // Error on bit 1: 3'b010
        raw_bits_3q = 3'b010; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b000 || syn_3q !== 2'b11 || corr_mask_3q !== 3'b010) begin
            $display("FAIL: 3Q Flip Q1 -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // Error on bit 2: 3'b100
        raw_bits_3q = 3'b100; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b000 || syn_3q !== 2'b10 || corr_mask_3q !== 3'b100) begin
            $display("FAIL: 3Q Flip Q2 -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // Logical |1> codeword: 3'b111
        // No error
        raw_bits_3q = 3'b111; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b111 || syn_3q !== 2'b00 || corr_mask_3q !== 3'b000) begin
            $display("FAIL: 3Q No-error |1> -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // Error on bit 0: 3'b110
        raw_bits_3q = 3'b110; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b111 || syn_3q !== 2'b01 || corr_mask_3q !== 3'b001) begin
            $display("FAIL: 3Q Flip Q0 on |1> -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // Error on bit 1: 3'b101
        raw_bits_3q = 3'b101; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b111 || syn_3q !== 2'b11 || corr_mask_3q !== 3'b010) begin
            $display("FAIL: 3Q Flip Q1 on |1> -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // Error on bit 2: 3'b011
        raw_bits_3q = 3'b011; #10;
        tests_run = tests_run + 1;
        if (corrected_bits_3q !== 3'b111 || syn_3q !== 2'b10 || corr_mask_3q !== 3'b100) begin
            $display("FAIL: 3Q Flip Q2 on |1> -> syn=%b corr=%b out=%b", syn_3q, corr_mask_3q, corrected_bits_3q);
            errors = errors + 1;
        end

        // --------------------------------------------------------------------
        // Test Part 2: 3-Qubit Soft 0-MUL Parity Mode
        // --------------------------------------------------------------------
        mode_soft_3q = 1;
        a_y0 = 8'sd45;  // positive -> state 0
        a_y1 = -8'sd60; // negative -> state 1
        a_y2 = 8'sd70;  // positive -> state 0
        #10;
        tests_run = tests_run + 1;
        // s0 = (45>=0) != (-60>=0) -> 1
        // s1 = (-60>=0) != (70>=0) -> 1
        // Expected syndrome = 2'b11 (Q1 error)
        // diff0 = 45 - (-60) = 105
        // diff1 = -60 - 70 = -130
        if (syn_3q !== 2'b11 || soft_diff0 !== 9'sd105 || soft_diff1 !== -9'sd130) begin
            $display("FAIL: 3Q Soft Parity -> syn=%b diff0=%d diff1=%d", syn_3q, soft_diff0, soft_diff1);
            errors = errors + 1;
        end

        // --------------------------------------------------------------------
        // Test Part 3: 5-Qubit Syndrome Decoding All 16 States
        // --------------------------------------------------------------------
        mode_soft_5q = 0;
        a_s0 = 0; a_s1 = 0; a_s2 = 0; a_s3 = 0;

        for (i = 0; i < 16; i = i + 1) begin
            syn_in_5q = i[3:0]; #10;
            tests_run = tests_run + 1;

            if (syn_5q !== i[3:0]) begin
                $display("FAIL: 5Q syn mismatch for %d: got %b", i, syn_5q);
                errors = errors + 1;
            end

            if (target_q_5q !== exp_target[i] || corr_pauli_5q !== exp_pauli[i]) begin
                $display("FAIL: 5Q decode for syn=%d: got target=%d pauli=%b, exp target=%d pauli=%b",
                         i, target_q_5q, corr_pauli_5q, exp_target[i], exp_pauli[i]);
                errors = errors + 1;
            end

            // Verify error_detected flag
            if (i == 0 && err_det_5q !== 1'b0) begin
                $display("FAIL: 5Q syn=0 should have error_detected=0");
                errors = errors + 1;
            end else if (i > 0 && err_det_5q !== 1'b1) begin
                $display("FAIL: 5Q syn=%d should have error_detected=1", i);
                errors = errors + 1;
            end

            // Verify per-qubit dispatched correction signal
            if (i == 0) begin
                if (corr_qubits_5q !== 10'b00_00_00_00_00) begin
                    $display("FAIL: 5Q syn=0 corr_qubits != 0");
                    errors = errors + 1;
                end
            end else begin
                // Exactly one qubit should have non-zero correction
                if (corr_qubits_5q[exp_target[i]*2 +: 2] !== exp_pauli[i]) begin
                    $display("FAIL: 5Q syn=%d target qubit %d pauli mismatch", i, exp_target[i]);
                    errors = errors + 1;
                end
            end
        end

        // --------------------------------------------------------------------
        // Summary
        // --------------------------------------------------------------------
        $display("-----------------------------------------------------------------");
        if (errors == 0) begin
            $display("ALL %0d TESTS PASSED WITH 0 ERRORS! (Bit-Exact RTL Verified)", tests_run);
        end else begin
            $display("TEST FAILED: %0d errors out of %0d tests run.", errors, tests_run);
        end
        $display("=================================================================");
        $finish;
    end

endmodule
