<script lang="ts">
    import type { PostInfo } from 'cms';
    let { data } = $props<{ data: { posts: PostInfo[] } }>();
</script>

<h1>Posts</h1>

{#each data.posts as post (post.pageId)}
    <a href={`/${post.pathname}`}>{post.title}</a>
    <pre>{JSON.stringify(post, null, 2)}</pre>
{/each}
