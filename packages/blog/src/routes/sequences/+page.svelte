<script lang="ts">
    import Posts from '$lib/components/ui/posts.svelte';
    let { data } = $props();
</script>

<svelte:head>
    <title>Sequences | rodent.club</title>
</svelte:head>
<Posts title="Sequences" posts={data.sequences} />
