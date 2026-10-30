// ============================================================================
// AXON Sovereign Quantum Tech - M3 QEC Decoder Prototype
// Module: qec_decoder_5qubit_0mul
// Description: 5-Qubit Perfect Code [[5, 1, 3]] Single-Cycle Decoder.
//
// Stabilizer Generators:
//   g0 = X Z Z X I
//   g1 = I X Z Z X
//   g2 = X I X Z Z
//   g3 = Z X I X Z
//
// Syndrome: 4 bits {s3, s2, s1, s0} indicating anti-commutation with generators.
// Decodes all 15 single-qubit Pauli errors (X, Y, Z on qubits 0..4) in a
// single combinational clock cycle with ZERO multipliers.
//
// Pauli Encoding:
//   2'b00 = I (Identity / No error)
//   2'b01 = X (Bit-flip)
//   2'b10 = Y (Bit + Phase-flip)
//   2'b11 = Z (Phase-flip)
// ============================================================================

`timescale 1ns / 1ps

module qec_decoder_5qubit_0mul (
    // Mode selection: 1 = derive syndrome from analog demodulated signals; 0 = direct syndrome
    input wire mode_soft,
    
    // Direct 4-bit binary syndrome from ancilla readout {s3, s2, s1, s0}
    input wire [3:0] syndrome_in,
    
    // Digitized signed int8 voltages from 4 ancilla readout resonators
    input wire signed [7:0] analog_s0,
    input wire signed [7:0] analog_s1,
    input wire signed [7:0] analog_s2,
    input wire signed [7:0] analog_s3,
    
    // Effective syndrome used for decoding
    output wire [3:0] syndrome,
    
    // Error flag: 1 if any error detected
    output wire error_detected,
    
    // Identified error location: target qubit index 0..4 (3'd7 if no error)
    output reg [2:0] target_qubit,
    
    // Identified error type: 00=I, 01=X, 10=Y, 11=Z
    output reg [1:0] corr_pauli,
    
    // Parallel per-qubit correction control (5 qubits x 2 bits)
    // [1:0] = Q0, [3:2] = Q1, [5:4] = Q2, [7:6] = Q3, [9:8] = Q4
    output reg [9:0] corr_qubits
);

    // 1. Syndrome determination
    // In soft/analog mode, sign bit (negative voltage < 0) corresponds to state |1> (syndrome=1)
    wire [3:0] syn_analog = {analog_s3[7], analog_s2[7], analog_s1[7], analog_s0[7]};
    assign syndrome = mode_soft ? syn_analog : syndrome_in;
    assign error_detected = (syndrome != 4'b0000);

    // 2. Exact 1-to-1 Bijection Syndrome Decoding LUT
    // Generated directly from FiveQubitCode commutator algebra in Rust
    always @* begin
        case (syndrome)
            4'd0:  begin target_qubit = 3'd7; corr_pauli = 2'b00; end // No Error (I)
            4'd1:  begin target_qubit = 3'd1; corr_pauli = 2'b01; end // Q1, X
            4'd2:  begin target_qubit = 3'd4; corr_pauli = 2'b11; end // Q4, Z
            4'd3:  begin target_qubit = 3'd2; corr_pauli = 2'b01; end // Q2, X
            4'd4:  begin target_qubit = 3'd2; corr_pauli = 2'b11; end // Q2, Z
            4'd5:  begin target_qubit = 3'd0; corr_pauli = 2'b11; end // Q0, Z
            4'd6:  begin target_qubit = 3'd3; corr_pauli = 2'b01; end // Q3, X
            4'd7:  begin target_qubit = 3'd2; corr_pauli = 2'b10; end // Q2, Y
            4'd8:  begin target_qubit = 3'd0; corr_pauli = 2'b01; end // Q0, X
            4'd9:  begin target_qubit = 3'd3; corr_pauli = 2'b11; end // Q3, Z
            4'd10: begin target_qubit = 3'd1; corr_pauli = 2'b11; end // Q1, Z
            4'd11: begin target_qubit = 3'd1; corr_pauli = 2'b10; end // Q1, Y
            4'd12: begin target_qubit = 3'd4; corr_pauli = 2'b01; end // Q4, X
            4'd13: begin target_qubit = 3'd0; corr_pauli = 2'b10; end // Q0, Y
            4'd14: begin target_qubit = 3'd4; corr_pauli = 2'b10; end // Q4, Y
            4'd15: begin target_qubit = 3'd3; corr_pauli = 2'b10; end // Q3, Y
            default: begin target_qubit = 3'd7; corr_pauli = 2'b00; end
        endcase
    end

    // 3. Parallel Correction Dispatcher for Physical QPU Feedback
    always @* begin
        corr_qubits = 10'b00_00_00_00_00; // Default: all identity
        if (error_detected) begin
            case (target_qubit)
                3'd0: corr_qubits[1:0] = corr_pauli;
                3'd1: corr_qubits[3:2] = corr_pauli;
                3'd2: corr_qubits[5:4] = corr_pauli;
                3'd3: corr_qubits[7:6] = corr_pauli;
                3'd4: corr_qubits[9:8] = corr_pauli;
                default: ; // Do nothing
            endcase
        end
    end

endmodule

