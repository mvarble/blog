use std::f64::consts::TAU;

use rand::Rng;

use super::{ProbabilityMeasure, STANDARD_UNIFORM};

pub struct Gaussian {
    mu: f64,
    sigma: f64,
}

impl Gaussian {
    pub fn new(mu: f64, sigma: f64) -> Self {
        if !mu.is_finite() || !sigma.is_finite() || sigma <= 0.0 {
            panic!(
                "Gaussian measures require finite means and finite positive standard-deviations."
            );
        }
        Self { mu, sigma }
    }

    pub fn mu(&self) -> f64 {
        self.mu
    }

    pub fn sigma(&self) -> f64 {
        self.sigma
    }
}

impl<R: Rng> ProbabilityMeasure<R> for Gaussian {
    type Sample = f64;
    fn sample(&self, rng: &mut R) -> f64 {
        let u0 = STANDARD_UNIFORM.sample(rng);
        let u1 = STANDARD_UNIFORM.sample(rng);
        self.mu + (-2.0 * self.sigma * u0.ln()).sqrt() * (TAU * u1).cos()
    }
}
