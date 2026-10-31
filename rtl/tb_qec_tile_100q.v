// ============================================================================
// Testbench for 100-Qubit Modular Tiling Decoder (qec_tile_100q_0mul)
// ============================================================================

`timescale 1ns / 1ps

module tb_qec_tile_100q;

    reg clk;
    reg rst_n;
    reg valid_in;
    reg [79:0] syndrome_bus;

    wire valid_out;
    wire [19:0] tile_error_detected;
    wire [59:0] tile_target_qubit;
    wire [39:0] tile_corr_pauli;
    wire [199:0] global_corr_bus;
    wire [4:0] total_errors_count;

    // Instantiate DUT
    qec_tile_100q_0mul dut (
        .clk                 (clk),
        .rst_n               (rst_n),
        .valid_in            (valid_in),
        .syndrome_bus        (syndrome_bus),
        .valid_out           (valid_out),
        .tile_error_detected (tile_error_detected),
        .tile_target_qubit   (tile_target_qubit),
        .tile_corr_pauli     (tile_corr_pauli),
        .global_corr_bus     (global_corr_bus),
        .total_errors_count  (total_errors_count)
    );

    // Clock generator (100 MHz, 10ns period)
    always #5 clk = ~clk;

    integer errors;

    initial begin
        clk = 0;
        rst_n = 0;
        valid_in = 0;
        syndrome_bus = 80'd0;
        errors = 0;

        // Reset pulse
        #20;
        rst_n = 1;
        #10;

        $display("=== TB_QEC_TILE_100Q: Simulation Start ===");

        // Test 1: All 20 tiles idle (syndrome 0)
        valid_in = 1;
        syndrome_bus = 80'd0;
        #10;
        if (total_errors_count !== 5'd0 || tile_error_detected !== 20'd0) begin
            $display("FAIL Test 1: Idle tiles reported error! count=%d", total_errors_count);
            errors = errors + 1;
        end else begin
            $display("PASS Test 1: All 20 tiles idle (count=0)");
        end

        // Test 2: Invert syndromes on Tile 0 (syn=0001 -> Q0 bitflip X) and Tile 19 (syn=0010 -> Q1 bitflip)
        // Tile 0 is bus[3:0], Tile 19 is bus[79:76]
        syndrome_bus[3:0] = 4'b0001;
        syndrome_bus[79:76] = 4'b0010;
        #10;
        if (total_errors_count !== 5'd2) begin
            $display("FAIL Test 2: Expected 2 errors, got %d", total_errors_count);
            errors = errors + 1;
        end else if (tile_error_detected[0] !== 1'b1 || tile_error_detected[19] !== 1'b1) begin
            $display("FAIL Test 2: Tile detection mask mismatch: %b", tile_error_detected);
            errors = errors + 1;
        end else begin
            $display("PASS Test 2: 2 errors detected in Tile 0 and Tile 19 simultaneously (count=2)");
        end

        // Test 3: Set errors on 10 tiles simultaneously
        // Tiles 0, 2, 4, 6, 8, 10, 12, 14, 16, 18
        syndrome_bus = 80'd0;
        syndrome_bus[0*4 +: 4] = 4'b0001;
        syndrome_bus[2*4 +: 4] = 4'b0011;
        syndrome_bus[4*4 +: 4] = 4'b0101;
        syndrome_bus[6*4 +: 4] = 4'b0111;
        syndrome_bus[8*4 +: 4] = 4'b1001;
        syndrome_bus[10*4 +: 4] = 4'b1011;
        syndrome_bus[12*4 +: 4] = 4'b1101;
        syndrome_bus[14*4 +: 4] = 4'b1111;
        syndrome_bus[16*4 +: 4] = 4'b0010;
        syndrome_bus[18*4 +: 4] = 4'b0100;
        #10;
        if (total_errors_count !== 5'd10) begin
            $display("FAIL Test 3: Expected 10 errors, got %d", total_errors_count);
            errors = errors + 1;
        end else begin
            $display("PASS Test 3: 10 parallel errors across 100 qubits decoded in 1 cycle (count=10)");
        end

        #20;
        if (errors == 0) begin
            $display("RESULT PASS=3 FAIL=0: All 100-Qubit Tile Decoder Tests PASSED!");
            $finish;
        end else begin
            $fatal(1, "TB_QEC_TILE_100Q FAILED with %0d errors", errors);
        end
    end

endmodule

