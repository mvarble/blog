<script lang="ts">
    import Post from '$lib/components/post.svelte';
    import type { PostInfoWithDescription } from '$lib/types';
    let { title, posts }: { title: string; posts: PostInfoWithDescription[] } = $props();
</script>

<div class="root">
    <h1>{title}</h1>
    <div class="thumbs">
        {#each posts as post (post.pathname)}
            <Post {...post} />
        {/each}
    </div>
</div>

<style>
    .root {
        padding: var(--page-padding-top) var(--page-padding-side) var(--page-padding-bottom);
    }
    .thumbs {
        display: grid;
        grid-template-columns: 1fr;
        --post-photo-min-width: 200px;
        box-sizing: border-box;
    }

    @media (min-width: 1400px) {
        .thumbs {
            grid-template-columns: 1fr 1fr;
        }
    }
</style>
