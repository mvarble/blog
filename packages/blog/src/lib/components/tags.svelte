<script lang="ts">
    let { tags }: { tags: string[] } = $props();
</script>

{#if tags.length}
    <ul>
        {#each tags as tag (tag)}<li>{tag}</li>{/each}
    </ul>
{/if}

<style>
    ul {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    li {
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font: 500 0.75rem / 1.4 var(--font-ui);
    }
</style>
