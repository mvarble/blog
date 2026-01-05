<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import NeedJavascript from '$lib/components/need-javascript.svelte';
    import lib from '../code.svelte';

    // state
    let a = $state(-1.0);
    let b = $state(1.0);
    let samples: number[] = $state([]);

    let svg: SVGSVGElement | undefined = $state(undefined);
    let draggingA = $state(false);
    let draggingB = $state(false);

    // affine transform [-3, 3] => [10, 90]
    function toViewBox(u: number): number {
        return (80.0 * (u + 3.0)) / 6.0 + 10.0;
    }

    // affine transform [10, 90] => [-3, 3]
    function fromViewBox(x: number): number {
        return (6.0 * (x - 10.0)) / 80.0 - 3.0;
    }

    // dragging callback
    function onmousemove(event: MouseEvent) {
        if (draggingA || draggingB) {
            const { x } = new DOMPoint(event.clientX, event.clientY).matrixTransform(
                svg!.getScreenCTM()!.inverse(),
            );
            if (draggingA) {
                a = Math.max(-3, Math.min(fromViewBox(x), 2));
            }
            if (draggingB) {
                b = Math.max(-2, Math.min(fromViewBox(x), 3));
            }
        }
    }

    function onmouseup() {
        draggingA = false;
        draggingB = false;
    }

    // derived state
    const uInts = [-3, -2, -1, 0, 1, 2, 3];
    const uxInts = uInts.map((u) => [u, toViewBox(u)]);
    const xIntsPath = uxInts.reduce((d, [_, x]) => d + `M ${x} 12 L ${x} 8 `, '');
    let aX = $derived(toViewBox(a));
    let bX = $derived(toViewBox(b));

    // reactivity: a < b
    $effect(() => {
        let lastA = untrack(() => a);
        if (lastA >= b - 0.1) {
            a = Math.max(b - 1, -3);
        }
    });
    $effect(() => {
        let lastB = untrack(() => b);
        if (lastB <= a + 0.1) {
            b = Math.min(a + 1, 3);
        }
    });

    // perform random sampling if form changes or library status changes
    $effect(() => {
        if (lib.uniform_samples) {
            samples = lib.uniform_samples(a, b, 50);
        }
    });
</script>

<svelte:document {onmousemove} {onmouseup} />
<NeedJavascript loading={lib.loading}>
    {#if lib.uniform_samples}
        <button
            class="button"
            style:margin="0.5em 0"
            onclick={() => (samples = lib.uniform_samples!(a, b, 50))}>Randomly sample</button
        >
        <svg bind:this={svg} viewBox="0 0 100 25" role="main">
            <path d="M 5 10 L 95 10 {xIntsPath}" stroke="currentColor" fill="none" />
            <text x={aX} y="3" font-size="4" text-anchor="middle" fill="currentColor">a</text>
            <text x={bX} y="3" font-size="4" text-anchor="middle" fill="currentColor">b</text>
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
            <path
                d="M {aX + 1} 5 L {aX} 5 L {aX} 15 L {aX + 1} 15"
                class="handle"
                class:dragging={draggingA}
                fill="none"
                role="button"
                tabindex="0"
                onmousedown={() => (draggingA = true)}
                onmouseup={() => (draggingA = false)}
            />
            <path
                d="M {bX - 1} 5 L {bX} 5 L {bX} 15 L {bX - 1} 15"
                class="handle"
                class:dragging={draggingB}
                fill="none"
                role="button"
                tabindex="0"
                onmousedown={() => (draggingB = true)}
                onmouseup={() => (draggingB = false)}
            />
        </svg>
    {/if}
</NeedJavascript>

<style>
    svg {
        display: block;
        margin: 0 auto;
        max-width: 500px;
    }
    .handle {
        stroke: currentColor;
        &:hover,
        &.dragging {
            stroke: var(--fg-accent);
        }
    }
</style>
