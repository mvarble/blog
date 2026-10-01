<script lang="ts">
    import '@mvarble/mesearch-ui/fonts';
    import 'katex/dist/katex.min.css';
    import '@mvarble/mesearch-markdown/styles/katex.css';
    import '@mvarble/mesearch-ui/styles/index.css';
    import '../styles/index.css';

    import { goto } from '$app/navigation';
    import { configure, Shell } from '@mvarble/mesearch-ui';

    let { children } = $props();

    configure({ kinds: { post: 'Post', sequence: 'Sequence', page: 'Sequence page' } });
</script>

{#snippet logo()}
    <span class="rat" role="img" aria-label="A rat"></span>
{/snippet}

<Shell
    title="rodent.club"
    home="/"
    links={[
        { url: '/posts/', label: 'Posts', icon: 'pen' },
        { url: '/sequences/', label: 'Sequences', icon: 'book' },
    ]}
    search="/search.json"
    navigate={goto}
    {logo}
>
    {@render children()}
</Shell>

<style>
    .rat {
        width: 1.9rem;
        height: 1.9rem;
        background: currentColor;
        mask: url('/icons/rat.svg') center / contain no-repeat;
        -webkit-mask: url('/icons/rat.svg') center / contain no-repeat;
    }
</style>
