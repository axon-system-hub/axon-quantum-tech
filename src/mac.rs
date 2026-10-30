//! MAC datapath models. Each returns the result plus operation counts and the
//! per-lane intermediate terms (used by the activity proxy).

use crate::trit::Trit;
use crate::LANES;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct OpCount {
    pub muls: u32,
    pub adds: u32,
    pub skips: u32,
}

#[derive(Clone, Debug)]
pub struct MacOut {
    pub y: i32,
    pub ops: OpCount,
    /// Per-lane term fed to the accumulator.
    pub terms: [i32; LANES],
}

/// A) Dense int8 x int8 multiplier datapath.
pub fn mac_int8(x: &[i8; LANES], w: &[i8; LANES]) -> MacOut {
    let mut y = 0i32;
    let mut terms = [0i32; LANES];
    let mut ops = OpCount::default();
    for i in 0..LANES {
        terms[i] = x[i] as i32 * w[i] as i32;
        ops.muls += 1;
        y += terms[i];
        ops.adds += 1;
    }
    MacOut { y, ops, terms }
}

/// B) Ternary weights through a multiplier (fair baseline).
pub fn mac_tern_mul(x: &[i8; LANES], w: &[Trit; LANES]) -> MacOut {
    let mut y = 0i32;
    let mut terms = [0i32; LANES];
    let mut ops = OpCount::default();
    for i in 0..LANES {
        terms[i] = x[i] as i32 * w[i].value();
        ops.muls += 1;
        y += terms[i];
        ops.adds += 1;
    }
    MacOut { y, ops, terms }
}

/// C) AXON 0-MUL Sign-Select: skip / add / subtract. No multiplication anywhere.
pub fn mac_0mul(x: &[i8; LANES], w: &[Trit; LANES]) -> MacOut {
    let mut y = 0i32;
    let mut terms = [0i32; LANES];
    let mut ops = OpCount::default();
    for i in 0..LANES {
        let sx = x[i] as i32;
        terms[i] = match w[i] {
            Trit::Zero => {
                ops.skips += 1; // 0-SKIP: nothing is computed or moved
                0
            }
            Trit::Pos => sx,
            Trit::Neg => -sx,
        };
        if w[i] != Trit::Zero {
            y += terms[i]; // add (Pos) or subtract (Neg) in the accumulator
            ops.adds += 1;
        }
    }
    MacOut { y, ops, terms }
}
