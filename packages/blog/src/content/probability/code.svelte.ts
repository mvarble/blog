import wasmLoader from '$lib/util/wasm-loader';

export class ProbabilityLibrary {
    loading = $state(true);
    bernoulli_example?: (p: number, samples: number) => number | undefined = $state(undefined);

    constructor() {
        wasmLoader(import.meta.glob('./code/pkg/code.js'), ['bernoulli_example'], this);
    }
}

const lib = new ProbabilityLibrary();

export default lib;
