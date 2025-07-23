<script lang="ts">
    import type { PostInfo } from 'cms';
    let { data } = $props<{ data: { sequences: PostInfo[] } }>();
</script>

<h1>Sequences</h1>

{#each data.sequences as sequence (sequence.pageId)}
    <a href={`/${sequence.pathname}`}>{sequence.title}</a>
    <pre>{JSON.stringify(sequence, null, 2)}</pre>
{/each}
