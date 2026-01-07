import wasmLoader from '$lib/util/wasm-loader';

export class ProbabilityLibrary {
    loading = $state(true);
    fair_bernoulli_sample?: (() => boolean) | undefined = $state(undefined);
    bernoulli_sample?: ((p: number) => boolean) | undefined = $state(undefined);
    bernoulli_sample_statistic?: ((p: number, samples: number) => number) | undefined =
        $state(undefined);
    uniform_samples?: ((a: number, b: number, samples: number) => number[]) | undefined =
        $state(undefined);
    exponential_samples?: ((lambda: number, samples: number) => number[]) | undefined =
        $state(undefined);
    gaussian_samples?: ((mu: number, sigma: number, samples: number) => number[]) | undefined =
        $state(undefined);

    constructor() {
        wasmLoader(
            import.meta.glob('./code/pkg/code.js'),
            [
                'fair_bernoulli_sample',
                'bernoulli_sample',
                'bernoulli_sample_statistic',
                'uniform_samples',
                'exponential_samples',
                'gaussian_samples',
            ],
            this,
        );
    }
}

const lib = new ProbabilityLibrary();

export default lib;
