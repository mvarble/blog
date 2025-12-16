<script lang="ts">
    import type { Snippet } from 'svelte';

    let { originator, children }: { originator: string; children: Snippet } = $props();
</script>

<blockquote>
    <div>{@render children()}</div>
    <div>-&nbsp;{originator}</div>
</blockquote>

<style>
    blockquote > :first-child {
        font-style: italic;
        margin-bottom: 0.5em;
    }
    blockquote > :nth-child(2) {
        color: var(--fg-exclaim);
    }
</style>
