use rand::Rng;

use super::ProbabilityMeasure;

pub struct Uniform {
    low: f64,
    scale: f64,
}

impl Uniform {
    pub fn new(low: f64, high: f64) -> Self {
        // determine the length of the interval as a linear scale of [0, 1]
        if !low.is_finite() || !high.is_finite() || low >= high {
            panic!("Uniform probability measures require intervals on non-empty intervals [a, b].");
        }
        let mut scale = high - low;

        // make sure scaling [0, 1] => [a, b] and floating-point precision do not clash
        let max_rand = 1.0 - f64::EPSILON;
        loop {
            if scale * max_rand + low <= high {
                break;
            }
            scale = f64::from_bits(scale.to_bits() - 1);
        }

        // these are the parts which help us map [0, 1] => [a, b] linearly
        Self { low, scale }
    }
}

impl<R: Rng> ProbabilityMeasure<R> for Uniform {
    type Sample = f64;
    fn sample(&self, rng: &mut R) -> f64 {
        // sample a number in [1, 2] by means of grabbing the 52 exponential bits.
        let rand_in_12 = f64::from_bits(rng.next_u64() | (1023 << 52));

        // move the sample to [a, b] by means of an affine transform
        (rand_in_12 - 1.0) * self.scale + self.low
    }
}
