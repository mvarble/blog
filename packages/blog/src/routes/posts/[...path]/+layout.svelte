<script lang="ts">
    import { page } from '$app/state';

    import WithSidebar from '$lib/components/ui/with-sidebar.svelte';

    let { children } = $props();
</script>

<WithSidebar contents={page.data.contents}>
    {@render children()}
</WithSidebar>
