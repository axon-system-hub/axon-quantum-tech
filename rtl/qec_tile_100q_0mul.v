// ============================================================================
// AXON Sovereign Quantum Tech - 100-Qubit Modular Tiling QEC Engine
// Module: qec_tile_100q_0mul
// Description: 100 Physical Qubits arranged into 20 tiles of [[5, 1, 3]]
//              perfect code with 20 parallel 0-MUL decoders.
//
// Features:
// - Decodes all 20 tiles in exactly 1 clock cycle.
// - Zero multipliers (0-MUL): pure combinational sign-select logic.
// - Aggregated error reporting & parallel correction vectors.
// ============================================================================

`timescale 1ns / 1ps

module qec_tile_100q_0mul (
    input wire clk,
    input wire rst_n,
    input wire valid_in,
    
    // 20 tiles x 4 bits syndrome per tile = 80 bits syndrome input
    input wire [79:0] syndrome_bus,
    
    output reg valid_out,
    
    // 20 bits: 1 if tile i detected an error
    output reg [19:0] tile_error_detected,
    
    // 20 tiles x 3 bits target qubit index (0..4) = 60 bits
    output reg [59:0] tile_target_qubit,
    
    // 20 tiles x 2 bits Pauli correction (00: I, 01: X, 10: Y, 11: Z) = 40 bits
    output reg [39:0] tile_corr_pauli,
    
    // 20 tiles x 10 bits per-qubit correction bus = 200 bits
    output reg [199:0] global_corr_bus,
    
    // Total number of errors corrected across all 100 qubits (0..20)
    output reg [4:0] total_errors_count
);

    // Wires for individual tile outputs
    wire [19:0] w_error_detected;
    wire [2:0]  w_target_qubit [0:19];
    wire [1:0]  w_corr_pauli [0:19];
    wire [9:0]  w_corr_qubits [0:19];
    wire [3:0]  w_syndrome_out [0:19];

    // Generate 20 parallel 5-qubit 0-MUL decoders
    genvar i;
    generate
        for (i = 0; i < 20; i = i + 1) begin : gen_tile_decoders
            qec_decoder_5qubit_0mul u_tile_dec (
                .mode_soft      (1'b0),
                .syndrome_in    (syndrome_bus[i*4 +: 4]),
                .analog_s0      (8'sd0),
                .analog_s1      (8'sd0),
                .analog_s2      (8'sd0),
                .analog_s3      (8'sd0),
                .syndrome       (w_syndrome_out[i]),
                .error_detected (w_error_detected[i]),
                .target_qubit   (w_target_qubit[i]),
                .corr_pauli     (w_corr_pauli[i]),
                .corr_qubits    (w_corr_qubits[i])
            );
        end
    endgenerate

    // Registered output stage
    integer j;
    reg [4:0] count_comb;

    always @(*) begin
        count_comb = 5'd0;
        for (j = 0; j < 20; j = j + 1) begin
            count_comb = count_comb + {4'd0, w_error_detected[j]};
        end
    end

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out           <= 1'b0;
            tile_error_detected <= 20'd0;
            tile_target_qubit   <= 60'd0;
            tile_corr_pauli     <= 40'd0;
            global_corr_bus     <= 200'd0;
            total_errors_count  <= 5'd0;
        end else begin
            valid_out           <= valid_in;
            tile_error_detected <= w_error_detected;
            total_errors_count  <= count_comb;
            
            for (j = 0; j < 20; j = j + 1) begin
                tile_target_qubit[j*3 +: 3]   <= w_target_qubit[j];
                tile_corr_pauli[j*2 +: 2]     <= w_corr_pauli[j];
                global_corr_bus[j*10 +: 10]   <= w_corr_qubits[j];
            end
        end
    end

endmodule
