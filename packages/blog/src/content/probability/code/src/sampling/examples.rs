use wasm_bindgen::prelude::wasm_bindgen;

use super::{Bernoulli, ProbabilityMeasure};

#[wasm_bindgen]
pub fn bernoulli_example(samples: usize) -> f64 {
    let mut rng = rand::rng();
    let bernoulli = Bernoulli::new(0.35);
    let count = (0..samples).fold(0.0, |count, _| {
        if bernoulli.sample(&mut rng) {
            count + 1.0
        } else {
            count
        }
    });
    count / samples as f64
}
