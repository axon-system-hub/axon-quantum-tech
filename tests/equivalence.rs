use axon_quantum_tech::mac::{mac_0mul, mac_tern_mul};
use axon_quantum_tech::rng::Rng;
use axon_quantum_tech::trit::Trit;
use axon_quantum_tech::LANES;

fn rand_trit(r: &mut Rng) -> Trit {
    match r.below(3) {
        0 => Trit::Neg,
        1 => Trit::Zero,
        _ => Trit::Pos,
    }
}

#[test]
fn zero_mul_is_bit_exact_with_ternary_multiply() {
    let mut r = Rng::new(7);
    for _ in 0..200_000 {
        let mut x = [0i8; LANES];
        let mut w = [Trit::Zero; LANES];
        for i in 0..LANES {
            x[i] = r.i8();
            w[i] = rand_trit(&mut r);
        }
        let a = mac_tern_mul(&x, &w);
        let b = mac_0mul(&x, &w);
        assert_eq!(a.y, b.y);
        assert_eq!(a.terms, b.terms);
    }
}

#[test]
fn zero_mul_path_performs_no_multiplies_and_skips_zeros() {
    let x = [10i8, -20, 30, -128];
    let w = [Trit::Zero, Trit::Pos, Trit::Neg, Trit::Zero];
    let o = mac_0mul(&x, &w);
    assert_eq!(o.ops.muls, 0);
    assert_eq!(o.ops.skips, 2);
    assert_eq!(o.ops.adds, 2);
    assert_eq!(o.y, -20 - 30);
}

#[test]
fn extreme_values_do_not_overflow() {
    let x = [-128i8; LANES];
    let w = [Trit::Neg; LANES];
    assert_eq!(mac_0mul(&x, &w).y, 128 * LANES as i32);
}

#[test]
fn encodings_match_rtl() {
    assert_eq!(Trit::Zero.to_signed2(), 0b00);
    assert_eq!(Trit::Pos.to_signed2(), 0b01);
    assert_eq!(Trit::Neg.to_signed2(), 0b11);
    assert_eq!(Trit::Neg.to_sign_select(), 0b11);
}
