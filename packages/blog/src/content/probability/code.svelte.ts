import wasmLoader from '$lib/util/wasm-loader';

export class ProbabilityLibrary {
    loading = $state(true);
    bernoulli_sample?: ((p: number) => boolean) | undefined = $state(undefined);
    bernoulli_sample_statistic?: ((p: number, samples: number) => number) | undefined =
        $state(undefined);

    constructor() {
        wasmLoader(
            import.meta.glob('./code/pkg/code.js'),
            ['bernoulli_sample', 'bernoulli_sample_statistic'],
            this,
        );
    }
}

const lib = new ProbabilityLibrary();

export default lib;
