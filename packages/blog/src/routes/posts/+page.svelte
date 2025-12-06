<script lang="ts">
    import Post from '$lib/components/post.svelte';
    let { data } = $props();
</script>

<div>
    <h1>Posts</h1>
    {#each data.posts as post (post.pathname)}
        <Post {...post} />
    {/each}
</div>

<style>
    div {
        padding: var(--page-padding-top) var(--page-padding-side) var(--page-padding-bottom);
    }
</style>
