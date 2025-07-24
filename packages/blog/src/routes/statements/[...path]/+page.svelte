<script lang="ts">
    import type { Statement as StatementT } from 'cms';
    import type { Component } from 'svelte';

    import Statement from '$lib/components/statement.svelte';

    interface Data {
        statement: StatementT;
        component: Component;
        parentPathname: string;
    }
    let { data }: { data: Data } = $props();
</script>

<div>
    <p>
        The original location of this statement is at
        <a href="/{data.parentPathname}#{data.statement.slug}">this page</a>.
    </p>
    <Statement cms={data.statement} default={data.component} noBlock />
</div>
