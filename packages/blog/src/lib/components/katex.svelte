<script lang="ts">
    import { renderToString } from 'katex';
    import macros from '../../../katex.js';

    let { latex }: { latex: string } = $props();
    let html = $derived(renderToString(latex, { macros }));
</script>

<span>{@html html}</span>
