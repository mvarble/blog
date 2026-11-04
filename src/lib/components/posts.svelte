<script lang="ts">
    import Post from '$lib/components/post.svelte';
    import type { PostInfoWithDescription } from '$lib/types';

    let { posts }: { posts: PostInfoWithDescription[] } = $props();
</script>

<ul>
    {#each posts as post (post.pathname)}
        <li><Post {...post} /></li>
    {/each}
</ul>

<style>
    ul {
        display: grid;
        gap: 1.25rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }
</style>
