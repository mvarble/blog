use rand::Rng;

use super::{ProbabilityMeasure, STANDARD_UNIFORM};

pub struct Exponential {
    lambda: f64,
}

impl Exponential {
    pub fn new(lambda: f64) -> Self {
        if !lambda.is_finite() || lambda <= 0.0 {
            panic!("Exponential measures require positive rates.");
        }
        Self { lambda }
    }

    pub fn lambda(&self) -> f64 {
        self.lambda
    }
}

impl<R: Rng> ProbabilityMeasure<R> for Exponential {
    type Sample = f64;
    fn sample(&self, rng: &mut R) -> f64 {
        let u = STANDARD_UNIFORM.sample(rng);
        -(1.0 / self.lambda) * u.ln()
    }
}
