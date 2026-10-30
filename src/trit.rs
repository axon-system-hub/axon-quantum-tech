//! Ternary weight type and the two hardware encodings used by the RTL study.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Trit {
    Neg,
    Zero,
    Pos,
}

impl Trit {
    /// 2-bit signed encoding: 00 = 0, 01 = +1, 11 = -1.
    pub fn to_signed2(self) -> u8 {
        match self {
            Trit::Zero => 0b00,
            Trit::Pos => 0b01,
            Trit::Neg => 0b11,
        }
    }

    /// Sign-Select encoding: bit0 = nonzero, bit1 = negative.
    pub fn to_sign_select(self) -> u8 {
        match self {
            Trit::Zero => 0b00,
            Trit::Pos => 0b01,
            Trit::Neg => 0b11,
        }
    }

    /// Value as i32 (reference only; not used in the 0-MUL path).
    pub fn value(self) -> i32 {
        match self {
            Trit::Neg => -1,
            Trit::Zero => 0,
            Trit::Pos => 1,
        }
    }
}

