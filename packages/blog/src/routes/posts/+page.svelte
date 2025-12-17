<script lang="ts">
    import Posts from '$lib/components/ui/posts.svelte';
    let { data } = $props();
</script>

<svelte:head>
    <title>Posts | rodent.club</title>
</svelte:head>
<Posts title="Posts" posts={data.posts} />
