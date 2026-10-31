// ============================================================================
// AXON Sovereign Quantum Tech - Planar CSS Surface Code Decoder
// Module: qec_decoder_surface_d3_0mul
// Description: Rotated Surface Code [[9, 1, 3]] (distance d=3) Single-Cycle
//              Combinational 0-MUL Decoder.
//
// 3x3 Data Qubit Lattice (D0..D8):
//   D0 (0,0) -- D1 (0,1) -- D2 (0,2)
//      |           |           |
//   D3 (1,0) -- D4 (1,1) -- D5 (1,2)
//      |           |           |
//   D6 (2,0) -- D7 (2,1) -- D8 (2,2)
//
// 4 Z-Plaquette Checks (detect X errors) & 4 X-Plaquette Checks (detect Z errors):
//   Check 0 (Top-Left):     D0 ^ D1 ^ D3 ^ D4
//   Check 1 (Top-Right):    D1 ^ D2 ^ D4 ^ D5
//   Check 2 (Bottom-Left):  D3 ^ D4 ^ D6 ^ D7
//   Check 3 (Bottom-Right): D4 ^ D5 ^ D7 ^ D8
//
// Pauli Encoding per Data Qubit (corr_qubits[2*q +: 2]):
//   2'b00 = I (No error)
//   2'b01 = X (Bit-flip only)
//   2'b10 = Y (Combined X + Z error on same qubit)
//   2'b11 = Z (Phase-flip only)
// ============================================================================

`timescale 1ns / 1ps

module qec_decoder_surface_d3_0mul (
    // 0 = use direct 4-bit syndromes (z_syndrome_in, x_syndrome_in)
    // 1 = extract syndromes on-chip from 9-bit data parity inputs (x_err_in, z_err_in)
    input wire mode_extract,

    input wire [3:0] z_syndrome_in,
    input wire [3:0] x_syndrome_in,

    input wire [8:0] x_err_in,
    input wire [8:0] z_err_in,

    output wire [3:0] z_syndrome,
    output wire [3:0] x_syndrome,

    output wire error_detected,

    // 9-bit one-hot correction masks for X and Z errors
    output reg [8:0] corr_x_mask,
    output reg [8:0] corr_z_mask,

    // 9 qubits x 2-bit Pauli correction bus (00=I, 01=X, 10=Y, 11=Z)
    output reg [17:0] corr_qubits
);

    // 1. Plaquette parity extraction (pure XOR trees, 0 multipliers)
    wire [3:0] z_syn_calc = {
        x_err_in[4] ^ x_err_in[5] ^ x_err_in[7] ^ x_err_in[8], // Z3: Bottom-Right
        x_err_in[3] ^ x_err_in[4] ^ x_err_in[6] ^ x_err_in[7], // Z2: Bottom-Left
        x_err_in[1] ^ x_err_in[2] ^ x_err_in[4] ^ x_err_in[5], // Z1: Top-Right
        x_err_in[0] ^ x_err_in[1] ^ x_err_in[3] ^ x_err_in[4]  // Z0: Top-Left
    };

    wire [3:0] x_syn_calc = {
        z_err_in[4] ^ z_err_in[5] ^ z_err_in[7] ^ z_err_in[8], // X3: Bottom-Right
        z_err_in[3] ^ z_err_in[4] ^ z_err_in[6] ^ z_err_in[7], // X2: Bottom-Left
        z_err_in[1] ^ z_err_in[2] ^ z_err_in[4] ^ z_err_in[5], // X1: Top-Right
        z_err_in[0] ^ z_err_in[1] ^ z_err_in[3] ^ z_err_in[4]  // X0: Top-Left
    };

    assign z_syndrome = mode_extract ? z_syn_calc : z_syndrome_in;
    assign x_syndrome = mode_extract ? x_syn_calc : x_syndrome_in;
    assign error_detected = (z_syndrome != 4'b0000) || (x_syndrome != 4'b0000);

    // 2. Single-cycle injective syndrome decoding LUT for X errors (from Z-checks)
    always @* begin
        case (z_syndrome)
            4'b0001: corr_x_mask = 9'b000_000_001; // D0
            4'b0011: corr_x_mask = 9'b000_000_010; // D1
            4'b0010: corr_x_mask = 9'b000_000_100; // D2
            4'b0101: corr_x_mask = 9'b000_001_000; // D3
            4'b1111: corr_x_mask = 9'b000_010_000; // D4 (Center)
            4'b1010: corr_x_mask = 9'b000_100_000; // D5
            4'b0100: corr_x_mask = 9'b001_000_000; // D6
            4'b1100: corr_x_mask = 9'b010_000_000; // D7
            4'b1000: corr_x_mask = 9'b100_000_000; // D8
            default: corr_x_mask = 9'b000_000_000;
        endcase
    end

    // 3. Single-cycle injective syndrome decoding LUT for Z errors (from X-checks)
    always @* begin
        case (x_syndrome)
            4'b0001: corr_z_mask = 9'b000_000_001; // D0
            4'b0011: corr_z_mask = 9'b000_000_010; // D1
            4'b0010: corr_z_mask = 9'b000_000_100; // D2
            4'b0101: corr_z_mask = 9'b000_001_000; // D3
            4'b1111: corr_z_mask = 9'b000_010_000; // D4 (Center)
            4'b1010: corr_z_mask = 9'b000_100_000; // D5
            4'b0100: corr_z_mask = 9'b001_000_000; // D6
            4'b1100: corr_z_mask = 9'b010_000_000; // D7
            4'b1000: corr_z_mask = 9'b100_000_000; // D8
            default: corr_z_mask = 9'b000_000_000;
        endcase
    end

    // 4. Combine X and Z corrections into 2-bit Pauli bus per qubit:
    //    (x=0, z=0) -> 2'b00 (I)
    //    (x=1, z=0) -> 2'b01 (X)
    //    (x=1, z=1) -> 2'b10 (Y)
    //    (x=0, z=1) -> 2'b11 (Z)
    integer q;
    always @* begin
        for (q = 0; q < 9; q = q + 1) begin
            case ({corr_x_mask[q], corr_z_mask[q]})
                2'b00: corr_qubits[q*2 +: 2] = 2'b00; // I
                2'b10: corr_qubits[q*2 +: 2] = 2'b01; // X
                2'b11: corr_qubits[q*2 +: 2] = 2'b10; // Y
                2'b01: corr_qubits[q*2 +: 2] = 2'b11; // Z
            endcase
        end
    end

endmodule
