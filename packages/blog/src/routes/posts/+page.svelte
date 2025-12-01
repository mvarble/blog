<script lang="ts">
    let { data } = $props();
</script>

<h1>Posts</h1>

{#each data.posts as post (post.pathname)}
    <a href={`/${post.pathname}`}>{post.title}</a>
    <pre>{JSON.stringify(post, null, 2)}</pre>
{/each}
