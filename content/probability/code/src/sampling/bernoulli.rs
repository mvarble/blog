use rand::Rng;

use super::ProbabilityMeasure;

pub struct Bernoulli {
    p_int: u64,
}

const ALWAYS_TRUE: u64 = u64::MAX;
const SCALE: f64 = 2.0 * (1u64 << 63) as f64;

impl Bernoulli {
    pub fn new(p: f64) -> Self {
        if !(0.0..1.0).contains(&p) {
            if p == 1.0 {
                Self { p_int: ALWAYS_TRUE }
            } else {
                panic!("The probability must be within [0, 1].");
            }
        } else {
            Self {
                p_int: (p * SCALE) as u64,
            }
        }
    }

    pub fn p(&self) -> f64 {
        if self.p_int == ALWAYS_TRUE {
            1.0
        } else {
            (self.p_int as f64) / SCALE
        }
    }
}

impl<R: Rng> ProbabilityMeasure<R> for Bernoulli {
    type Sample = bool;
    fn sample(&self, rng: &mut R) -> bool {
        if self.p_int == ALWAYS_TRUE {
            true
        } else {
            rng.next_u64() < self.p_int
        }
    }
}
