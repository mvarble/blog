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
    <div>
        {#if !noLabel}
            <strong>
                {cms.kind
                    .split(' ')
                    .map((str) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`)
                    .join(' ')}
                {cms.label}
            </strong>
        {/if}
        <StatementComponent></StatementComponent>
    </div>
{/snippet}

{#if noBlock}
    {@render component()}
{:else}
    <blockquote id={cms.slug}>
        {@render component()}
    </blockquote>
{/if}

<style>
    :global(ol) {
        list-style-type: none;
        counter-reset: item;
    }

    :global(ol > li) {
        counter-increment: item;
    }

    :global(ol > li:before) {
        content: '(' counter(item, lower-alpha) ')';
        display: inline-block;
        width: 30px;
    }
</style>
