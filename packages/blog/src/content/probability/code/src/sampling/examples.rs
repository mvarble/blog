use wasm_bindgen::prelude::wasm_bindgen;

use super::{Bernoulli, Exponential, FairBernoulli, ProbabilityMeasure, Uniform};

#[wasm_bindgen]
pub fn fair_bernoulli_sample() -> bool {
    let mut rng = rand::rng();
    FairBernoulli.sample(&mut rng)
}

#[wasm_bindgen]
pub fn bernoulli_sample_statistic(p: f64, sample_count: usize) -> f64 {
    let mut rng = rand::rng();
    let bernoulli = Bernoulli::new(p);
    let count = (0..sample_count).fold(0.0, |count, _| {
        if bernoulli.sample(&mut rng) {
            count + 1.0
        } else {
            count
        }
    });
    count / sample_count as f64
}

#[wasm_bindgen]
pub fn uniform_samples(a: f64, b: f64, sample_count: usize) -> Vec<f64> {
    let mut rng = rand::rng();
    let uniform = Uniform::new(a, b);
    (0..sample_count)
        .map(|_| uniform.sample(&mut rng))
        .collect()
}

#[wasm_bindgen]
pub fn exponential_samples(lambda: f64, sample_count: usize) -> Vec<f64> {
    let mut rng = rand::rng();
    let uniform = Exponential::new(lambda);
    (0..sample_count)
        .map(|_| uniform.sample(&mut rng))
        .collect()
}
