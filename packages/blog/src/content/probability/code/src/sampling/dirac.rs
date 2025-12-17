use rand::Rng;

use super::ProbabilityMeasure;

pub struct Dirac<T>(T);

impl<T> Dirac<T> {
    pub fn new(sample: T) -> Self {
        Self(sample)
    }
}

impl<T: Clone, R: Rng> ProbabilityMeasure<R> for Dirac<T> {
    type Sample = T;
    fn sample(&self, _: &mut R) -> T {
        self.0.clone()
    }
}
