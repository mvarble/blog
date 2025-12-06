<script lang="ts">
    import Post from '$lib/components/post.svelte';
    let { data } = $props();
</script>

<div>
    <h1>Sequences</h1>
    {#each data.sequences as sequence (sequence.pathname)}
        <Post {...sequence} />
    {/each}
</div>

<style>
    div {
        padding: var(--page-padding-top) var(--page-padding-side) var(--page-padding-bottom);
    }
</style>
