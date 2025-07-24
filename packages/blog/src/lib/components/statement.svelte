<script lang="ts">
    import type { Statement } from 'cms';
    import type { Component } from 'svelte';

    interface Props {
        default: Component;
        cms: Statement;
        noLabel?: boolean;
        noBlock?: boolean;
    }
    let { default: StatementComponent, cms, noLabel = false, noBlock = false }: Props = $props();
</script>

{#snippet component()}
    {#if !noLabel}
        <strong>
            {cms.kind
                .split(' ')
                .map((str) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`)
                .join(' ')}
            {cms.itemPrefix ? `${cms.itemPrefix}.${cms.item}` : String(cms.item)}.
        </strong>
    {/if}
    <StatementComponent></StatementComponent>
{/snippet}

{#if noBlock}
    {@render component()}
{:else}
    <blockquote id={cms.slug}>
        {@render component()}
    </blockquote>
{/if}

<style>
    blockquote {
        background: #efefef;
        padding: 1em;
    }
</style>
