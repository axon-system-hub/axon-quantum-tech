// ============================================================================
// AXON Sovereign Quantum Tech - M3 QEC Decoder Prototype
// Module: qec_decoder_3qubit_0mul
// Description: 3-Qubit Bit-Flip Code [[3, 1, 1]] Decoder using AXON 0-MUL Sign-Select.
//
// Stabilizers:
//   S0 = Z0 Z1  (Parity of Q0, Q1)
//   S1 = Z1 Z2  (Parity of Q1, Q2)
//
// In physical cryogenic/room-temp readout:
// - Analog demodulated IQ voltages are digitized to signed int8 [y0, y1, y2].
// - Parity differences are computed via 0-MUL:
//     P0 = (+1)*y0 + (-1)*y1 + (0)*y2  (0-SKIP on unused lane)
//     P1 = (0)*y0  + (+1)*y1 + (-1)*y2 (0-SKIP on unused lane)
// - Hard decisions: s0 = (y0 < 0) ^ (y1 < 0), s1 = (y1 < 0) ^ (y2 < 0).
//
// Correction Actions:
//   s1 s0 = 00 -> None (corr = 3'b000)
//   s1 s0 = 01 -> Flip Q0 (corr = 3'b001)
//   s1 s0 = 11 -> Flip Q1 (corr = 3'b010)
//   s1 s0 = 10 -> Flip Q2 (corr = 3'b100)
// ============================================================================

`timescale 1ns / 1ps

module qec_decoder_3qubit_0mul (
    // Mode selection: 1 = derive hard syndrome from analog inputs; 0 = use raw_bits
    input wire mode_soft,
    
    // Hard-decision binary inputs (measured qubit states: 0 or 1)
    input wire [2:0] raw_bits,
    
    // Analog digitized readout voltages (signed int8: positive -> 0, negative -> 1)
    input wire signed [7:0] analog_y0,
    input wire signed [7:0] analog_y1,
    input wire signed [7:0] analog_y2,
    
    // Computed syndrome: {s1, s0}
    output wire [1:0] syndrome,
    
    // Intermediate 0-MUL soft parity differences (y0 - y1, y1 - y2)
    output wire signed [8:0] soft_diff0,
    output wire signed [8:0] soft_diff1,
    
    // Single-bit correction mask: [2]=flip Q2, [1]=flip Q1, [0]=flip Q0
    output reg [2:0] corr_mask,
    
    // Corrected 3-bit codeword
    output wire [2:0] corrected_bits
);

    // 1. 0-MUL Sign-Select Parity Extraction (Multiplier-free Add/Sub)
    // Parity 0: y0 - y1
    // Parity 1: y1 - y2
    assign soft_diff0 = $signed(analog_y0) - $signed(analog_y1);
    assign soft_diff1 = $signed(analog_y1) - $signed(analog_y2);

    // 2. Syndrome bit evaluation
    // In binary readout: sign bit indicates state (analog < 0 is 1, analog >= 0 is 0)
    wire s0_analog = analog_y0[7] ^ analog_y1[7];
    wire s1_analog = analog_y1[7] ^ analog_y2[7];

    wire s0_raw = raw_bits[0] ^ raw_bits[1];
    wire s1_raw = raw_bits[1] ^ raw_bits[2];

    wire s0 = mode_soft ? s0_analog : s0_raw;
    wire s1 = mode_soft ? s1_analog : s1_raw;

    assign syndrome = {s1, s0};

    // 3. Single-cycle Combinational Syndrome Decoding LUT
    always @* begin
        case (syndrome)
            2'b00: corr_mask = 3'b000; // No error
            2'b01: corr_mask = 3'b001; // Error on Q0
            2'b11: corr_mask = 3'b010; // Error on Q1
            2'b10: corr_mask = 3'b100; // Error on Q2
            default: corr_mask = 3'b000;
        endcase
    end

    // 4. Output Corrected Codeword
    assign corrected_bits = raw_bits ^ corr_mask;

endmodule

