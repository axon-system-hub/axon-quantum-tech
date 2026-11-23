//! Strict OpenQASM 3 subset -> virtual quantum IR.
//!
//! Supports one qubit array and one optional bit array; h/s/x/y/z/cx/reset,
//! indexed measurements, and the legacy AXON qec_5q extension. Unsupported
//! syntax fails closed. No calibrated pulses, physical gates or existing
//! CPNPU T-ASM opcodes are implemented by this module.
//!
//! The 0-MUL constraint applies to classical decoder RTL, not complex-valued
//! statevector arithmetic or quantum gate synthesis.

/// Virtual quantum IR operation; not an opcode in the existing CPNPU ISA
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TasmOp {
    /// Virtual reset request; physical reset latency is backend-dependent
    Reset { qubit: usize },
    /// Hadamard request; backend lowering owns the calibrated physical gate.
    Hadamard { qubit: usize },
    /// Phase gate S
    Phase { qubit: usize },
    /// CNOT gate between control and target
    Cnot { control: usize, target: usize },
    /// Pauli X request; no physical feedback latency is implied.
    CorrectX { qubit: usize },
    /// Pauli Z request; no physical feedback latency is implied.
    CorrectZ { qubit: usize },
    /// Pauli Y request; no physical feedback latency is implied.
    CorrectY { qubit: usize },
    /// Unlowered five-qubit syndrome extraction request; not a surface-code operation.
    ExtractSyndrome5Q { tile_idx: usize, base_qubit: usize },
    /// Unlowered five-qubit correction request; requires a backend QEC protocol.
    ApplyQecCorrection5Q { tile_idx: usize },
    /// Readout measurement
    Measure { qubit: usize, classical_bit: usize },
}

impl TasmOp {
    /// Formats the instruction into legacy T-ASM-like debug notation (not executable CPNPU assembly)
    pub fn to_tasm_asm(&self) -> String {
        match self {
            TasmOp::Reset { qubit } => format!("T_RESET       q[{}]", qubit),
            TasmOp::Hadamard { qubit } => format!("T_0MUL_H      q[{}]", qubit),
            TasmOp::Phase { qubit } => format!("T_0MUL_S      q[{}]", qubit),
            TasmOp::Cnot { control, target } => {
                format!("T_0MUL_CX     q[{}], q[{}]", control, target)
            }
            TasmOp::CorrectX { qubit } => format!("T_0MUL_PX     q[{}]", qubit),
            TasmOp::CorrectZ { qubit } => format!("T_0MUL_PZ     q[{}]", qubit),
            TasmOp::CorrectY { qubit } => format!("T_0MUL_PY     q[{}]", qubit),
            TasmOp::ExtractSyndrome5Q {
                tile_idx,
                base_qubit,
            } => {
                format!("T_0MUL_SYND5Q tile[{}], base=q[{}]", tile_idx, base_qubit)
            }
            TasmOp::ApplyQecCorrection5Q { tile_idx } => {
                format!("T_0MUL_CORR5Q tile[{}]", tile_idx)
            }
            TasmOp::Measure {
                qubit,
                classical_bit,
            } => {
                format!("T_MEASURE     q[{}] -> c[{}]", qubit, classical_bit)
            }
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct QasmToTasmCompiler {
    pub instructions: Vec<TasmOp>,
    pub num_qubits: usize,
    pub num_bits: usize,
}

impl QasmToTasmCompiler {
    pub fn new() -> Self {
        Self::default()
    }

    /// Transactional replacement: an error leaves the previous program intact.
    pub fn compile_str(&mut self, source: &str) -> Result<usize, String> {
        if source.contains("/*") || source.contains("*/") {
            return Err("block comments are outside the supported subset".into());
        }
        let clean = source
            .lines()
            .map(|l| l.split("//").next().unwrap_or(""))
            .collect::<Vec<_>>()
            .join("\n");
        if !clean.trim_end().ends_with(';') {
            return Err("program must end with a semicolon".into());
        }
        let mut next = Self::new();
        let mut qreg: Option<String> = None;
        let mut creg: Option<String> = None;
        let mut header = false;
        let mut started = false;
        for (ordinal, statement) in clean.split(';').enumerate() {
            let s = statement.trim();
            if s.is_empty() {
                continue;
            }
            let parse = |msg: String| format!("statement {}: {}", ordinal + 1, msg);
            let (verb, args) = s.split_once(char::is_whitespace).unwrap_or((s, ""));
            let args = args.trim();
            if !header {
                if verb != "OPENQASM" || !matches!(args, "3" | "3.0") {
                    return Err(parse("expected OPENQASM 3.0 header".into()));
                }
                header = true;
                continue;
            }
            if verb == "include" {
                if started || args != "\"stdgates.inc\"" {
                    return Err(parse(
                        "only stdgates.inc before operations is supported".into(),
                    ));
                }
                continue;
            }
            if s.starts_with("qubit[") || s.starts_with("bit[") {
                if started {
                    return Err(parse("declarations must precede operations".into()));
                }
                let (kind, rest) = if let Some(r) = s.strip_prefix("qubit") {
                    (true, r)
                } else {
                    (false, s.strip_prefix("bit").unwrap())
                };
                let (count, name) = declaration(rest).map_err(parse)?;
                if kind {
                    if qreg.is_some() || creg.as_deref() == Some(&name) {
                        return Err(parse("duplicate register".into()));
                    }
                    next.num_qubits = count;
                    qreg = Some(name);
                } else {
                    if creg.is_some() || qreg.as_deref() == Some(&name) {
                        return Err(parse("duplicate register".into()));
                    }
                    next.num_bits = count;
                    creg = Some(name);
                }
                continue;
            }
            started = true;
            let qname = qreg
                .as_deref()
                .ok_or_else(|| parse("qubit register is not declared".into()))?;
            let qarg = |a: &str| operand(a, qname, next.num_qubits);
            let carg = |a: &str| {
                let name = creg
                    .as_deref()
                    .ok_or_else(|| "classical register is not declared".to_string())?;
                operand(a, name, next.num_bits)
            };
            let op = match verb {
                "h" => TasmOp::Hadamard {
                    qubit: qarg(args).map_err(parse)?,
                },
                "s" => TasmOp::Phase {
                    qubit: qarg(args).map_err(parse)?,
                },
                "x" => TasmOp::CorrectX {
                    qubit: qarg(args).map_err(parse)?,
                },
                "y" => TasmOp::CorrectY {
                    qubit: qarg(args).map_err(parse)?,
                },
                "z" => TasmOp::CorrectZ {
                    qubit: qarg(args).map_err(parse)?,
                },
                "reset" => TasmOp::Reset {
                    qubit: qarg(args).map_err(parse)?,
                },
                "cx" => {
                    let pair: Vec<_> = args.split(',').collect();
                    if pair.len() != 2 {
                        return Err(parse("cx requires two operands".into()));
                    }
                    let control = qarg(pair[0]).map_err(parse)?;
                    let target = qarg(pair[1]).map_err(parse)?;
                    if control == target {
                        return Err(parse("cx control equals target".into()));
                    }
                    TasmOp::Cnot { control, target }
                }
                "qec_5q" => {
                    let pair: Vec<_> = args.split(',').collect();
                    if pair.len() != 2 {
                        return Err(parse("qec_5q requires tile, base".into()));
                    }
                    let tile_idx = integer(pair[0]).map_err(parse)?;
                    let base_qubit = integer(pair[1]).map_err(parse)?;
                    if base_qubit
                        .checked_add(5)
                        .map_or(true, |end| end > next.num_qubits)
                    {
                        return Err(parse("qec_5q exceeds declared qubits".into()));
                    }
                    next.instructions.push(TasmOp::ExtractSyndrome5Q {
                        tile_idx,
                        base_qubit,
                    });
                    next.instructions
                        .push(TasmOp::ApplyQecCorrection5Q { tile_idx });
                    continue;
                }
                "measure" => {
                    let (q, c) = args
                        .split_once("->")
                        .ok_or_else(|| parse("measurement requires a destination".into()))?;
                    TasmOp::Measure {
                        qubit: qarg(q).map_err(parse)?,
                        classical_bit: carg(c).map_err(parse)?,
                    }
                }
                _ => {
                    if let Some((c, rhs)) = s.split_once('=') {
                        let rhs = rhs.trim();
                        let (word, q) = rhs.split_once(char::is_whitespace).unwrap_or((rhs, ""));
                        if word != "measure" {
                            return Err(parse("only measurement assignment is supported".into()));
                        }
                        TasmOp::Measure {
                            qubit: qarg(q).map_err(parse)?,
                            classical_bit: carg(c).map_err(parse)?,
                        }
                    } else {
                        return Err(parse(format!("unsupported instruction: {verb}")));
                    }
                }
            };
            next.instructions.push(op);
        }
        if next.num_qubits == 0 {
            return Err("missing qubit array".into());
        }
        let count = next.instructions.len();
        *self = next;
        Ok(count)
    }

    pub fn emit_assembly(&self) -> String {
        let mut out = format!("// AXON VIRTUAL QUANTUM IR ONLY - NOT EXECUTABLE CPNPU T-ASM\n// Physical QPU: NOT_CONFIGURED; calibrated gate lowering: NOT_IMPLEMENTED\n// Active Qubits: {}, Classical Bits: {}\n", self.num_qubits, self.num_bits);
        for (idx, op) in self.instructions.iter().enumerate() {
            out.push_str(&format!("{:04X}:  {}\n", idx, op.to_tasm_asm()));
        }
        out
    }
}

fn integer(s: &str) -> Result<usize, String> {
    let s = s.trim();
    if s.is_empty() || !s.bytes().all(|c| c.is_ascii_digit()) {
        return Err("expected unsigned decimal integer".into());
    }
    s.parse().map_err(|_| "integer overflow".into())
}

fn declaration(s: &str) -> Result<(usize, String), String> {
    let end = s.find(']').ok_or("missing declaration bracket")?;
    let count = integer(
        s.strip_prefix('[')
            .ok_or("missing declaration dimension")?
            .get(..end - 1)
            .ok_or("invalid dimension")?,
    )?;
    let name = s[end + 1..].trim();
    if count == 0 || count > 65536 {
        return Err("register size must be 1..65536".into());
    }
    if name.is_empty()
        || !name
            .bytes()
            .enumerate()
            .all(|(i, c)| c == b'_' || c.is_ascii_alphabetic() || (i > 0 && c.is_ascii_digit()))
    {
        return Err("invalid register name".into());
    }
    Ok((count, name.into()))
}

fn operand(s: &str, name: &str, count: usize) -> Result<usize, String> {
    let s = s.trim();
    let (reg, index) = s
        .split_once('[')
        .ok_or("expected indexed register operand")?;
    if reg.trim() != name {
        return Err(format!("undeclared register: {}", reg.trim()));
    }
    let index = integer(index.strip_suffix(']').ok_or("unexpected operand suffix")?)?;
    if index >= count {
        return Err(format!("register index {index} out of range 0..{count}"));
    }
    Ok(index)
}
