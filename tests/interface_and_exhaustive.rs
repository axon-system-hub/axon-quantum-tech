use axon_quantum_tech::encoding_bridge::{csd_to_signed2, signed2_to_csd};
use axon_quantum_tech::mac::{mac_0mul, mac_tern_mul};
use axon_quantum_tech::trit::Trit;
use axon_quantum_tech::LANES;

#[test]
fn exhaustive_single_lane_all_int8_and_ternary_weights() {
    for value in i8::MIN..=i8::MAX {
        for weight in [Trit::Neg, Trit::Zero, Trit::Pos] {
            let mut x = [0i8; LANES];
            let mut w = [Trit::Zero; LANES];
            x[0] = value;
            w[0] = weight;
            let actual = mac_0mul(&x, &w);
            let reference = mac_tern_mul(&x, &w);
            assert_eq!(actual.y, reference.y, "x={value}, w={weight:?}");
            assert_eq!(actual.terms, reference.terms);
        }
    }
}

#[test]
fn bridge_maps_valid_codes_and_rejects_every_other_byte() {
    for code in 0u8..=255 {
        match code {
            0 | 1 | 3 => assert_eq!(csd_to_signed2(signed2_to_csd(code).unwrap()), Ok(code)),
            _ => assert!(signed2_to_csd(code).is_err()),
        }
        match code {
            0 | 1 | 2 => assert_eq!(signed2_to_csd(csd_to_signed2(code).unwrap()), Ok(code)),
            _ => assert!(csd_to_signed2(code).is_err()),
        }
    }
}

