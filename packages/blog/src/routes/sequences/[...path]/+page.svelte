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

    function findSelf(
        filename: string,
        child: SequenceChild,
        index?: string,
    ): { self: SequenceChild; index?: string } | undefined {
        if (child.filename == filename) return { self: child, index };
        if (child.children) {
            for (let i = 0; i < child.children.length; ++i) {
                const out = findSelf(
                    filename,
                    child.children[i],
                    typeof index == 'string' ? (index ? `${index}.${i}` : `${i}`) : undefined,
                );
                if (out) return out;
            }
        }
    }

    let { self, index } = $derived(
        findSelf(data.filename, data.sequence, data.sequence.enumerate ? '' : undefined)!,
    );
</script>

<h1>{index ? `${index}. ${self.title}` : self.title}</h1>

<data.component />

{#if data.next}
    <a href={`/${data.next.pathname}`}>Next up: {data.next.title}</a>
{/if}
