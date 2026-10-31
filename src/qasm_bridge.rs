//! OpenQASM 3.0 to AXON T-ASM & 0-MUL Hardware Syndrome Compiler Bridge.
//!
//! # Architecture:
//! Compiles standard OpenQASM 3.0 instructions (Clifford gates: H, S, CX, and Pauli measurements)
//! into AXON T-ASM microcode instructions targeting the 0-MUL syndrome decoder datapaths.
//!
//! # Supported Gates:
//! - `h q[i]`       : Hadamard gate (swaps X and Z bases, 0-MUL Sign-Select transformation)
//! - `s q[i]`       : Phase gate (Z^(1/2))
//! - `cx q[c], q[t]`: Controlled-NOT (entangling gate)
//! - `x q[i]`, `z q[i]`, `y q[i]`: Pauli correction dispatches
//! - `measure q[i] -> c[j]`: Readout / syndrome measurement
//! - `qec_tile q[0..4]`: AXON custom OpenQASM 3.0 pragma invoking single-cycle 5-qubit 0-MUL QEC

use std::str::FromStr;

/// Target AXON T-ASM Micro-Operation for Cryogenic / Optical Control
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TasmOp {
    /// Zero-latency qubit reset / ground-state prep
    Reset { qubit: usize },
    /// Hadamard gate via optical phase-shifter or RF pulse
    Hadamard { qubit: usize },
    /// Phase gate S
    Phase { qubit: usize },
    /// CNOT gate between control and target
    Cnot { control: usize, target: usize },
    /// Pauli X correction (single-cycle feedback from 0-MUL decoder)
    CorrectX { qubit: usize },
    /// Pauli Z correction (single-cycle feedback from 0-MUL decoder)
    CorrectZ { qubit: usize },
    /// Pauli Y correction (single-cycle feedback from 0-MUL decoder)
    CorrectY { qubit: usize },
    /// Direct 0-MUL syndrome check over a tile (5-qubit perfect code or 9-qubit surface code)
    ExtractSyndrome5Q { tile_idx: usize, base_qubit: usize },
    /// Apply single-cycle 0-MUL correction based on extracted syndrome
    ApplyQecCorrection5Q { tile_idx: usize },
    /// Readout measurement
    Measure { qubit: usize, classical_bit: usize },
}

impl TasmOp {
    /// Formats the instruction into human-readable T-ASM assembly
    pub fn to_tasm_asm(&self) -> String {
        match self {
            TasmOp::Reset { qubit } => format!("T_RESET       q[{}]", qubit),
            TasmOp::Hadamard { qubit } => format!("T_0MUL_H      q[{}]", qubit),
            TasmOp::Phase { qubit } => format!("T_0MUL_S      q[{}]", qubit),
            TasmOp::Cnot { control, target } => format!("T_0MUL_CX     q[{}], q[{}]", control, target),
            TasmOp::CorrectX { qubit } => format!("T_0MUL_PX     q[{}]", qubit),
            TasmOp::CorrectZ { qubit } => format!("T_0MUL_PZ     q[{}]", qubit),
            TasmOp::CorrectY { qubit } => format!("T_0MUL_PY     q[{}]", qubit),
            TasmOp::ExtractSyndrome5Q { tile_idx, base_qubit } => {
                format!("T_0MUL_SYND5Q tile[{}], base=q[{}]", tile_idx, base_qubit)
            }
            TasmOp::ApplyQecCorrection5Q { tile_idx } => {
                format!("T_0MUL_CORR5Q tile[{}]", tile_idx)
            }
            TasmOp::Measure { qubit, classical_bit } => {
                format!("T_MEASURE     q[{}] -> c[{}]", qubit, classical_bit)
            }
        }
    }
}

/// Simple, robust OpenQASM 3.0 subset parser
pub struct QasmToTasmCompiler {
    pub instructions: Vec<TasmOp>,
    pub num_qubits: usize,
    pub num_bits: usize,
}

impl QasmToTasmCompiler {
    pub fn new() -> Self {
        Self {
            instructions: Vec::new(),
            num_qubits: 0,
            num_bits: 0,
        }
    }

    /// Compiles an OpenQASM 3.0 source string into a sequence of T-ASM instructions
    pub fn compile_str(&mut self, source: &str) -> Result<usize, String> {
        let lines = source.lines();
        let mut count = 0;

        for (line_num, raw_line) in lines.enumerate() {
            let line = raw_line.split("//").next().unwrap_or("").trim();
            if line.is_empty() || line.starts_with("OPENQASM") || line.starts_with("include") {
                continue;
            }

            let line = line.trim_end_matches(';').trim();

            if line.starts_with("qubit") {
                // e.g. qubit[5] q;
                if let Some(dim) = extract_bracket_index(line) {
                    self.num_qubits = self.num_qubits.max(dim);
                }
            } else if line.starts_with("bit") {
                // e.g. bit[4] c;
                if let Some(dim) = extract_bracket_index(line) {
                    self.num_bits = self.num_bits.max(dim);
                }
            } else if line.starts_with("h ") {
                let q = parse_qubit_arg(line, "h")?;
                self.instructions.push(TasmOp::Hadamard { qubit: q });
                count += 1;
            } else if line.starts_with("s ") {
                let q = parse_qubit_arg(line, "s")?;
                self.instructions.push(TasmOp::Phase { qubit: q });
                count += 1;
            } else if line.starts_with("cx ") {
                let (c, t) = parse_two_qubits(line, "cx")?;
                self.instructions.push(TasmOp::Cnot { control: c, target: t });
                count += 1;
            } else if line.starts_with("x ") {
                let q = parse_qubit_arg(line, "x")?;
                self.instructions.push(TasmOp::CorrectX { qubit: q });
                count += 1;
            } else if line.starts_with("z ") {
                let q = parse_qubit_arg(line, "z")?;
                self.instructions.push(TasmOp::CorrectZ { qubit: q });
                count += 1;
            } else if line.starts_with("y ") {
                let q = parse_qubit_arg(line, "y")?;
                self.instructions.push(TasmOp::CorrectY { qubit: q });
                count += 1;
            } else if line.starts_with("reset ") {
                let q = parse_qubit_arg(line, "reset")?;
                self.instructions.push(TasmOp::Reset { qubit: q });
                count += 1;
            } else if line.starts_with("qec_5q ") {
                // Custom OpenQASM extension pragma: qec_5q tile_idx, base_qubit
                let parts: Vec<&str> = line["qec_5q ".len()..].split(',').map(|s| s.trim()).collect();
                if parts.len() == 2 {
                    let tile = usize::from_str(parts[0]).map_err(|e| e.to_string())?;
                    let base = usize::from_str(parts[1]).map_err(|e| e.to_string())?;
                    self.instructions.push(TasmOp::ExtractSyndrome5Q { tile_idx: tile, base_qubit: base });
                    self.instructions.push(TasmOp::ApplyQecCorrection5Q { tile_idx: tile });
                    count += 2;
                }
            } else if line.contains("measure ") {
                // e.g. measure q[0] -> c[0]
                let parts: Vec<&str> = line.split("->").map(|s| s.trim()).collect();
                if parts.len() == 2 {
                    let q_part = parts[0].trim_start_matches("measure").trim();
                    let q = extract_bracket_index(q_part).ok_or_else(|| format!("Invalid measure line: {}", line_num))?;
                    let c = extract_bracket_index(parts[1]).ok_or_else(|| format!("Invalid measure line: {}", line_num))?;
                    self.instructions.push(TasmOp::Measure { qubit: q, classical_bit: c });
                    count += 1;
                }
            }
        }

        Ok(count)
    }

    /// Generates assembly listing
    pub fn emit_assembly(&self) -> String {
        let mut out = String::new();
        out.push_str("// ============================================================\n");
        out.push_str("// AXON T-ASM Microcode (Compiled from OpenQASM 3.0)\n");
        out.push_str(&format!("// Active Qubits: {}, Classical Bits: {}\n", self.num_qubits, self.num_bits));
        out.push_str("// ============================================================\n\n");

        for (idx, op) in self.instructions.iter().enumerate() {
            out.push_str(&format!("{:04X}:  {}\n", idx, op.to_tasm_asm()));
        }
        out
    }
}

fn extract_bracket_index(s: &str) -> Option<usize> {
    let start = s.find('[')? + 1;
    let end = s.find(']')?;
    s[start..end].trim().parse().ok()
}

fn parse_qubit_arg(line: &str, prefix: &str) -> Result<usize, String> {
    let arg = line[prefix.len()..].trim();
    extract_bracket_index(arg).ok_or_else(|| format!("Could not parse qubit in '{}'", line))
}

fn parse_two_qubits(line: &str, prefix: &str) -> Result<(usize, usize), String> {
    let args = line[prefix.len()..].trim();
    let parts: Vec<&str> = args.split(',').map(|s| s.trim()).collect();
    if parts.len() != 2 {
        return Err(format!("Expected 2 arguments in '{}'", line));
    }
    let q1 = extract_bracket_index(parts[0]).ok_or_else(|| format!("Invalid q1 in '{}'", line))?;
    let q2 = extract_bracket_index(parts[1]).ok_or_else(|| format!("Invalid q2 in '{}'", line))?;
    Ok((q1, q2))
}
