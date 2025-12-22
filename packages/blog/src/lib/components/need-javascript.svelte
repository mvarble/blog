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
    <span>This component is interactive and requires javascript to be enabled.</span>
{:else if loading && childLoading}
    {@render childLoading()}
{:else if loading}
    <span>Loading...</span>
{:else}
    {@render children()}
{/if}
