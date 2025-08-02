<script lang="ts">
    import type { Sequence, SequenceChild } from 'cms';
    import type { Component } from 'svelte';

    interface Data {
        filename: string;
        sequence: Sequence;
        component: Component;
        next: SequenceChild;
    }
    let { data }: { data: Data } = $props();

    function findSelf(filename: string, child: SequenceChild): SequenceChild | undefined {
        if (child.filename == filename) return child;
        if (child.children) {
            for (let i = 0; i < child.children.length; ++i) {
                const out = findSelf(filename, child.children[i]);
                if (out) return out;
            }
        }
    }

    let self = $derived(findSelf(data.filename, data.sequence)!);
</script>

<h1>{self.label ? `${self.label}. ${self.title}` : self.title}</h1>

<data.component />

{#if data.next}
    <a href={`/${data.next.pathname}`}>Next up: {data.next.title}</a>
{/if}
