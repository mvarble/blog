use rand::Rng;

use super::ProbabilityMeasure;

pub struct FairBernoulli;

impl<R: Rng> ProbabilityMeasure<R> for FairBernoulli {
    type Sample = bool;
    fn sample(&self, rng: &mut R) -> bool {
        (rng.next_u32() & 0b1) == 1
    }
}
