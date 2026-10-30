//! Switching-activity proxy: Hamming distance of datapath signals between
//! consecutive vectors. Software proxy only (no glitches, no capacitance).

use crate::mac::MacOut;
use crate::LANES;

#[derive(Default)]
pub struct ActivityMeter {
    prev: Option<([i32; LANES], i32)>,
    pub toggles: u64,
    pub vectors: u64,
    pub muls: u64,
    pub adds: u64,
    pub skips: u64,
}

impl ActivityMeter {
    pub fn observe(&mut self, o: &MacOut) {
        if let Some((pt, py)) = self.prev {
            for i in 0..LANES {
                self.toggles += (pt[i] ^ o.terms[i]).count_ones() as u64;
            }
            self.toggles += (py ^ o.y).count_ones() as u64;
        }
        self.prev = Some((o.terms, o.y));
        self.vectors += 1;
        self.muls += o.ops.muls as u64;
        self.adds += o.ops.adds as u64;
        self.skips += o.ops.skips as u64;
    }

    pub fn toggles_per_vector(&self) -> f64 {
        self.toggles as f64 / self.vectors.saturating_sub(1).max(1) as f64
    }
}

