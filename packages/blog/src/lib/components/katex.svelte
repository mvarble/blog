<script lang="ts">
    import { renderToString } from 'katex';
    import config from '../../../katex.js';

    let { latex }: { latex: string } = $props();
    let html = $derived(renderToString(latex, config));
</script>

<span>{@html html}</span>
