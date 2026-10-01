<script lang="ts">
    import { Article, ArticleHeader, References, Toc } from '@mvarble/mesearch-ui';

    import Tags from '$lib/components/tags.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>{data.title} | rodent.club</title>
</svelte:head>

{#snippet header()}
    <ArticleHeader
        crumbs={[
            { label: 'rodent.club', url: '/' },
            { label: 'Posts', url: '/posts/' },
        ]}
        titleHtml={data.titleHtml}
        created={data.created}
        updated={data.edited}
    >
        {#if data.tags.length}
            <div class="tags"><Tags tags={data.tags} /></div>
        {/if}
    </ArticleHeader>
{/snippet}

{#snippet references()}
    <References entries={data.references} />
{/snippet}

{#snippet contents(folded: boolean)}
    <Toc entries={data.toc} label={folded ? 'Contents' : 'On this page'} />
{/snippet}

<Article
    kind="post"
    {header}
    after={data.references.length ? references : undefined}
    right={data.toc.length ? contents : undefined}
>
    <data.component />
</Article>

<style>
    .tags {
        margin-top: 0.9rem;
    }
</style>
