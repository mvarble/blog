<script lang="ts">
    import Posts from '$lib/components/posts.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>Posts | rodent.club</title>
</svelte:head>

<main id="main" class="listing">
    <h1 class="listing-title">Posts</h1>
    <Posts posts={data.posts} />
</main>
