<!--
Icon component which delegates actual SVG markup to `icons` component.
Very nifty trick copied from the Svelte docs, at:
https://github.com/sveltejs/svelte.dev/blob/main/packages/site-kit/src/lib/components/Icon.svelte
-->

<script lang="ts">
    let { name, size = 20 }: { name: string; size?: string | number } = $props();
</script>

<svg width={size} height={size}>
    <use href="#{name}" />
</svg>

<style>
    svg {
        position: relative;
        overflow: hidden;
        vertical-align: middle;
        -o-object-fit: contain;
        object-fit: contain;
        -webkit-transform-origin: center center;
        transform-origin: center center;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
    }
</style>
