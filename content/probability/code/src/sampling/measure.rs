use rand::Rng;

pub trait ProbabilityMeasure<R: Rng> {
    type Sample;
    fn sample(&self, rng: &mut R) -> Self::Sample;
}
