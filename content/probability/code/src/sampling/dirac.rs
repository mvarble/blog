use rand::Rng;

use super::ProbabilityMeasure;

pub struct Dirac<T> {
    value: T,
}

impl<T> Dirac<T> {
    pub fn new(value: T) -> Self {
        Self { value }
    }
}

impl<T: Clone, R: Rng> ProbabilityMeasure<R> for Dirac<T> {
    type Sample = T;
    fn sample(&self, _: &mut R) -> T {
        self.value.clone()
    }
}
