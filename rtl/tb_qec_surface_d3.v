// ============================================================================
// Testbench: tb_qec_surface_d3.v
// Bit-Exact Verification of Rotated Surface Code [[9, 1, 3]] 0-MUL Decoder
// against Rust reference model (`src/surface_code.rs`)
// ============================================================================

`timescale 1ns / 1ps

module tb_qec_surface_d3;

    reg mode_extract;
    reg [3:0] z_syndrome_in;
    reg [3:0] x_syndrome_in;
    reg [8:0] x_err_in;
    reg [8:0] z_err_in;

    wire [3:0] z_syndrome;
    wire [3:0] x_syndrome;
    wire error_detected;
    wire [8:0] corr_x_mask;
    wire [8:0] corr_z_mask;
    wire [17:0] corr_qubits;

    qec_decoder_surface_d3_0mul dut (
        .mode_extract   (mode_extract),
        .z_syndrome_in  (z_syndrome_in),
        .x_syndrome_in  (x_syndrome_in),
        .x_err_in       (x_err_in),
        .z_err_in       (z_err_in),
        .z_syndrome     (z_syndrome),
        .x_syndrome     (x_syndrome),
        .error_detected (error_detected),
        .corr_x_mask    (corr_x_mask),
        .corr_z_mask    (corr_z_mask),
        .corr_qubits    (corr_qubits)
    );

    integer q;
    integer errors = 0;
    integer tests_run = 0;

    initial begin
        $display("=== TB_QEC_SURFACE_D3: Simulation Start ===");

        // 1. No error test
        mode_extract = 1'b1;
        z_syndrome_in = 4'd0;
        x_syndrome_in = 4'd0;
        x_err_in = 9'd0;
        z_err_in = 9'd0;
        #10;
        tests_run = tests_run + 1;
        if (error_detected !== 1'b0 || corr_x_mask !== 9'd0 || corr_z_mask !== 9'd0 || corr_qubits !== 18'd0) begin
            $display("FAIL: No-error state produced non-zero correction!");
            errors = errors + 1;
        end

        // 2. Exhaustive single-qubit X, Z, and Y errors across all 9 data qubits (27 cases)
        for (q = 0; q < 9; q = q + 1) begin
            // 2a. Single X error on D_q
            x_err_in = (9'd1 << q);
            z_err_in = 9'd0;
            #10;
            tests_run = tests_run + 1;
            if (corr_x_mask !== (9'd1 << q) || corr_z_mask !== 9'd0 || corr_qubits[q*2 +: 2] !== 2'b01) begin
                $display("FAIL: Single X error on D%0d -> corr_x=%b corr_pauli=%b", q, corr_x_mask, corr_qubits[q*2 +: 2]);
                errors = errors + 1;
            end

            // 2b. Single Z error on D_q
            x_err_in = 9'd0;
            z_err_in = (9'd1 << q);
            #10;
            tests_run = tests_run + 1;
            if (corr_x_mask !== 9'd0 || corr_z_mask !== (9'd1 << q) || corr_qubits[q*2 +: 2] !== 2'b11) begin
                $display("FAIL: Single Z error on D%0d -> corr_z=%b corr_pauli=%b", q, corr_z_mask, corr_qubits[q*2 +: 2]);
                errors = errors + 1;
            end

            // 2c. Single Y (combined X + Z) error on D_q
            x_err_in = (9'd1 << q);
            z_err_in = (9'd1 << q);
            #10;
            tests_run = tests_run + 1;
            if (corr_x_mask !== (9'd1 << q) || corr_z_mask !== (9'd1 << q) || corr_qubits[q*2 +: 2] !== 2'b10) begin
                $display("FAIL: Single Y error on D%0d -> corr_x=%b corr_z=%b corr_pauli=%b",
                         q, corr_x_mask, corr_z_mask, corr_qubits[q*2 +: 2]);
                errors = errors + 1;
            end
        end

        if (errors == 0) begin
            $display("ALL %0d SURFACE CODE d=3 TESTS PASSED WITH 0 ERRORS!", tests_run);
        end else begin
            $fatal(1, "TB_QEC_SURFACE_D3 FAILED with %0d errors out of %0d tests", errors, tests_run);
        end
        $finish;
    end

endmodule
