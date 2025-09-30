<script lang="ts">
    interface Props {
        prev: null | {
            path: string;
            title: string;
        };
        next: null | {
            path: string;
            title: string;
        };
    }

    let { prev = null, next = null }: Props = $props();
</script>

<div class="controls">
    <div class="flex">
        <span class:faded={!prev}>previous</span>
        <span class="next" class:faded={!next}>next</span>
    </div>

    <div class="flex">
        {#if prev}
            <a href={prev.path}>{prev.title}</a>
        {/if}

        {#if next}
            <a class="next" href={next.path}>{next.title}</a>
        {/if}
    </div>
</div>

<style>
    .controls {
        max-width: calc(var(--sk-page-content-width) + 1rem);
        border-top: 1px solid var(--sk-border);
        padding: 1rem 0 0 0;
        margin: 1rem 0 0 0;
        text-wrap: balance;

        .flex {
            display: flex;
            justify-content: space-between;
            gap: 2rem;

            .next {
                text-align: right;
            }

            .next:first-child {
                flex: 1;
            }
        }

        span {
            font: var(--sk-font-ui-medium);
            text-transform: uppercase;
            color: var(--sk-fg-3);

            &.faded {
                opacity: 0.4;
            }
        }

        a {
            font: var(--sk-font-body-small);
        }
    }
</style>
