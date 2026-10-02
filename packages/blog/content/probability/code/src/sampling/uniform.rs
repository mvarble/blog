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

    pub fn low(&self) -> f64 {
        self.low
    }

    pub fn high(&self) -> f64 {
        self.low + (1.0 - f64::EPSILON) * self.scale
    }
}

impl<R: Rng> ProbabilityMeasure<R> for Uniform {
    type Sample = f64;
    fn sample(&self, rng: &mut R) -> f64 {
        // get 64-bits of randomness from our `Rng` implementation
        let u = rng.next_u64();

        // apply the following transformation of the bits of our `u64`.
        //   b_{63}b_{62}...b_{52}b_{51}...b_{0} => 01...1b_{63}...b_{12}
        let u = (u >> 12) | (1023 << 52);

        // the floating-point representation of
        //   01...1b_{63}...b_{12}
        // will necessarily be a member of [1, 2) of the form $1 + k * 2^{-52}$
        let rand_in_12 = f64::from_bits(u);

        // move the sample to [a, b] by means of an affine transform
        (rand_in_12 - 1.0) * self.scale + self.low
    }
}

pub const STANDARD_UNIFORM: Uniform = Uniform {
    low: 0.0,
    scale: 1.0,
};
