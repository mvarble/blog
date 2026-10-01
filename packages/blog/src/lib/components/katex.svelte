<script lang="ts">
    import { renderToString } from 'katex';
    import { baseMacros } from '@mvarble/mesearch-markdown/katex';

    let { latex }: { latex: string } = $props();
    let html = $derived(renderToString(latex, { macros: { ...baseMacros } }));
</script>

<span>{@html html}</span>
