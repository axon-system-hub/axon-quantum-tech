//! Explicit conversion between this crate's signed-2 encoding and a CSD tag interface.
//! CSD contract used here: 00=zero, 01=positive, 10=negative, 11=reserved.
//! Integration with a particular RTL consumer requires independent contract verification.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InvalidEncoding(pub u8);

pub fn signed2_to_csd(bits: u8) -> Result<u8, InvalidEncoding> {
    match bits { 0b00 => Ok(0b00), 0b01 => Ok(0b01), 0b11 => Ok(0b10), _ => Err(InvalidEncoding(bits)) }
}

pub fn csd_to_signed2(bits: u8) -> Result<u8, InvalidEncoding> {
    match bits { 0b00 => Ok(0b00), 0b01 => Ok(0b01), 0b10 => Ok(0b11), _ => Err(InvalidEncoding(bits)) }
}

