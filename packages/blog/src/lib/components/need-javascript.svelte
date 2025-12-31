<script lang="ts">
    import { tick, type Snippet } from 'svelte';
    let {
        loading,
        childLoading,
        children,
    }: { loading: boolean; childLoading?: Snippet; children: Snippet } = $props();
    let ticked = $state(false);
    $effect(() => {
        tick().then(() => {
            ticked = true;
        });
    });
</script>

{#if !ticked}
    <blockquote class="red">
        This component is interactive and requires javascript to be enabled.
    </blockquote>
{:else if loading && childLoading}
    {@render childLoading()}
{:else if loading}
    <blockquote class="blue">Loading...</blockquote>
{:else}
    {@render children()}
{/if}

<style>
    blockquote {
        text-align: center;
    }
    .red {
        background: hsl(0, 50%, 93%);
    }
    :global(html.dark) .red {
        background: hsl(0, 40%, 20%);
    }
    .blue {
        background: hsl(210, 50%, 93%);
    }
    :global(html.dark) .blue {
        background: hsl(210, 40%, 20%);
    }
</style>
