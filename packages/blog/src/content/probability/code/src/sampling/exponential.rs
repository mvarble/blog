use rand::Rng;

use super::{ProbabilityMeasure, Uniform};

pub struct Exponential {
    lambda: f64,
    inner: Uniform,
}

impl Exponential {
    pub fn new(lambda: f64) -> Self {
        if lambda <= 0.0 {
            panic!("Exponential measures require positive rates.");
        }
        Self {
            lambda,
            inner: Uniform::new(0.0, 1.0),
        }
    }

    pub fn lambda(&self) -> f64 {
        self.lambda
    }
}

impl<R: Rng> ProbabilityMeasure<R> for Exponential {
    type Sample = f64;
    fn sample(&self, rng: &mut R) -> f64 {
        let u = self.inner.sample(rng);
        -(1.0 / self.lambda) * (1.0 - u).ln()
    }
}
