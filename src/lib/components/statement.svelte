<script lang="ts">
    import type { StatementInjection } from '@mvarble/mesearch-cms/presets/blog';
    import type { Component } from 'svelte';

    interface Props {
        default: Component;
        cms: StatementInjection;
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
                {cms.label}.
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
    strong {
        color: var(--fg-accent);
        font-weight: 500;
    }
    /* Enumerations in a document are lettered. Only in a document: the
     * site's own lists --- a sequence's track, the contents --- are not. */
    :global(.prose ol) {
        list-style-type: none;
        counter-reset: item;
    }

    :global(.prose ol > li) {
        counter-increment: item;
    }

    :global(.prose ol > li:before) {
        content: '(' counter(item, lower-alpha) ')';
        display: inline-block;
        width: 30px;
    }
</style>
