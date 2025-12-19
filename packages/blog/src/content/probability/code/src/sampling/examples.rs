use wasm_bindgen::prelude::wasm_bindgen;

use super::{Bernoulli, ProbabilityMeasure};

#[wasm_bindgen]
pub fn bernoulli_example(p: f64, samples: usize) -> f64 {
    let mut rng = rand::rng();
    let bernoulli = Bernoulli::new(p);
    let count = (0..samples).fold(0.0, |count, _| {
        if bernoulli.sample(&mut rng) {
            count + 1.0
        } else {
            count
        }
    });
    count / samples as f64
}
