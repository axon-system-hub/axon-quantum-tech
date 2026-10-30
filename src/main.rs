use axon_quantum_tech::activity::ActivityMeter;
use axon_quantum_tech::mac::{mac_0mul, mac_int8, mac_tern_mul};
use axon_quantum_tech::rng::Rng;
use axon_quantum_tech::trit::Trit;
use axon_quantum_tech::LANES;

const VECTORS: usize = 200_000;

fn main() {
    println!("AXON 0-MUL vs multiplier MAC study ({LANES} lanes, {VECTORS} vectors)");
    println!("NOTE: activity = software proxy, not silicon/cryo measurement.\n");
    println!(
        "{:>6} | {:>10} {:>10} {:>10} | {:>8} {:>8} | {:>10}",
        "zero%", "int8", "tern*mul", "0-MUL", "vs int8", "vs tern", "0-MUL muls"
    );
    for sp in [0u64, 33, 66, 90] {
        let mut rng = Rng::new(0xA70D_0000 + sp);
        let (mut a, mut b, mut c) = (
            ActivityMeter::default(),
            ActivityMeter::default(),
            ActivityMeter::default(),
        );
        for _ in 0..VECTORS {
            let mut x = [0i8; LANES];
            let mut w8 = [0i8; LANES];
            let mut wt = [Trit::Zero; LANES];
            for i in 0..LANES {
                x[i] = rng.i8();
                if rng.below(100) < sp {
                    w8[i] = 0;
                    wt[i] = Trit::Zero;
                } else {
                    w8[i] = (rng.below(255) as i16 - 127).clamp(-127, 127) as i8;
                    wt[i] = if rng.below(2) == 0 { Trit::Pos } else { Trit::Neg };
                }
            }
            a.observe(&mac_int8(&x, &w8));
            let ob = mac_tern_mul(&x, &wt);
            let oc = mac_0mul(&x, &wt);
            assert_eq!(ob.y, oc.y, "0-MUL must be bit-exact with ternary multiply");
            b.observe(&ob);
            c.observe(&oc);
        }
        let (ta, tb, tc) = (
            a.toggles_per_vector(),
            b.toggles_per_vector(),
            c.toggles_per_vector(),
        );
        println!(
            "{:>6} | {:>10.1} {:>10.1} {:>10.1} | {:>7.1}% {:>7.1}% | {:>10}",
            sp,
            ta,
            tb,
            tc,
            (tc / ta - 1.0) * 100.0,
            (tc / tb - 1.0) * 100.0,
            c.muls
        );
    }
}

