<script lang="ts">
    import Katex from '$lib/components/katex.svelte';
    import NeedJavascript from '$lib/components/need-javascript.svelte';
    import lib from '../code.svelte';

    // canvas properties
    const scale = 200;

    // form state
    let samples = $state(100);
    let p = $state(0.5);

    // derived state
    let pY = $derived((1.0 - p) * 0.75 * scale + 0.1 * scale);
    let pEst = $state(0.5);
    let headsHeight = $derived(pEst * (0.75 * scale));
    let tailsHeight = $derived(0.75 * scale - headsHeight);
    let headsY = $derived(tailsHeight + 0.1 * scale);
    let tailsY = $derived(headsHeight + 0.1 * scale);

    // perform random sampling if form changes or library status changes
    $effect(() => {
        if (lib.bernoulli_sample_statistic) {
            pEst = lib.bernoulli_sample_statistic(p, samples);
        }
    });
</script>

<NeedJavascript loading={lib.loading}>
    {#if lib.bernoulli_sample_statistic}
        <button
            class="button"
            style:margin="0.5em 0"
            onclick={() => (pEst = lib.bernoulli_sample_statistic!(p, samples))}
            >Randomly sample</button
        >
        <label>
            <span>Sample count: </span>
            <input type="range" min="1" max="1000" step="1" bind:value={samples} />
            <span>{samples}</span>
        </label>
        <label>
            <span>Parameter <Katex latex="p" />: </span>
            <input type="range" min="0" max="1" step="0.01" bind:value={p} />
            <span>{p.toFixed(2)}</span>
        </label>
        <svg viewBox="0 0 {scale} {scale}">
            <rect
                stroke="currentColor"
                fill="var(--button-bg-0)"
                x={0.1 * scale}
                y={headsY}
                width={0.4 * scale}
                height={headsHeight}
            />
            <rect
                stroke="currentColor"
                fill="var(--button-bg-0)"
                x={0.5 * scale}
                y={tailsY}
                width={0.4 * scale}
                height={tailsHeight}
            />
            <path d="M 0 {0.85 * scale} L {scale} {0.85 * scale}" stroke="currentColor" />
            <text x={0.3 * scale} y={0.95 * scale} text-anchor="middle" fill="currentColor"
                >Heads</text
            >
            <text x={0.7 * scale} y={0.95 * scale} text-anchor="middle" fill="currentColor"
                >Tails</text
            >
            <path d="M 5 {pY} L {scale} {pY}" stroke="currentColor" />
            <text x="0" y={pY + 5} text-anchor="end" font-style="italic" fill="currentColor">p</text
            >
        </svg>
    {/if}
</NeedJavascript>

<style>
    label {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        & > :first-child {
            text-decoration: underline;
        }
        & > * {
            margin: 0.25em 0.5em;
            flex-shrink: 0;
        }
        & > input {
            flex-grow: 1;
            min-width: 10em;
            accent-color: var(--button-bg-0);
        }
        & > span {
            width: 8rem;
        }
    }
    svg {
        display: block;
        margin: 1em auto;
        max-width: 400px;
        aspect-ratio: 1.5;
    }
</style>
