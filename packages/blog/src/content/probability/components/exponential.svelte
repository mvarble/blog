<script lang="ts">
    import Katex from '$lib/components/katex.svelte';
    import NeedJavascript from '$lib/components/need-javascript.svelte';
    import lib from '../code.svelte';

    // state
    let lambda = $state(1.0);
    let samples: number[] = $state([]);

    let svg: SVGSVGElement | undefined = $state(undefined);

    // affine transform [0, 10] => [10, 90]
    function toViewBox(u: number): number {
        return 8.0 * u + 10.0;
    }

    // derived state
    const uInts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const uxInts = uInts.map((u) => [u, toViewBox(u)]);
    const xIntsPath = uxInts.reduce((d, [_, x]) => d + `M ${x} 12 L ${x} 8 `, '');

    // perform random sampling if form changes or library status changes
    $effect(() => {
        if (lib.exponential_samples) {
            samples = lib.exponential_samples(lambda, 50);
        }
    });
</script>

{#snippet success()}
    <button
        class="button"
        style:margin="0.5em 0"
        onclick={() => (samples = lib.exponential_samples!(lambda, 50))}>Randomly sample</button
    >
    <label>
        <span>Parameter <Katex latex="\lambda" />: </span>
        <input type="range" min="0.5" max="2.0" step="0.1" bind:value={lambda} />
        <span>{lambda.toFixed(2)}</span>
    </label>
    <svg bind:this={svg} viewBox="0 0 100 25" role="main">
        <path d="M 5 10 L 100 10 {xIntsPath}" stroke="currentColor" fill="none" />
        {#each uxInts as [u, x] (u)}
            <text {x} y="20" font-size="4" text-anchor="middle" fill="currentColor">{u}</text>
        {/each}
        {#each samples as u (u)}
            <circle
                cx={toViewBox(u)}
                cy="10"
                r="1"
                fill="hsla(var(--fg-accent-hue), 100%, 50%, 0.1)"
                stroke="hsl(var(--fg-accent-hue), 100%, 50%)"
                stroke-width="0.1"
            />
        {/each}
    </svg>
{/snippet}

{#snippet failure()}
    <p>The library unit <code>exponential_samples</code> failed to load.</p>
{/snippet}

<svelte:document {onmousemove} {onmouseup} />
<NeedJavascript
    isLoading={lib.loading}
    isSuccess={typeof lib.exponential_samples != 'undefined'}
    {success}
    {failure}
/>

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
        margin: 0 auto;
        max-width: 500px;
    }
</style>
