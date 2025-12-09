<script lang="ts">
    import Posts from '$lib/components/ui/posts.svelte';
    let { data } = $props();
</script>

<Posts title="Posts" posts={data.posts} />
