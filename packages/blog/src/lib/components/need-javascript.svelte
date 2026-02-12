<script lang="ts">
    import { tick, type Snippet } from 'svelte';
    let {
        isLoading = false,
        isSuccess = true,
        loading,
        success,
        failure,
    }: {
        isLoading?: boolean;
        isSuccess?: boolean;
        loading?: Snippet;
        success: Snippet;
        failure?: Snippet;
    } = $props();
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
{:else if isLoading && loading}
    {@render loading()}
{:else if isLoading}
    <blockquote class="blue">Loading...</blockquote>
{:else if isSuccess}
    {@render success()}
{:else if failure}
    <blockquote class="red">
        {@render failure()}
    </blockquote>
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
