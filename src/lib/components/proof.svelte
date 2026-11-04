<script>
    let { children } = $props();
</script>

<div>
    <emph>Proof.</emph>
    {@render children()}
</div>

<style>
    emph {
        font-variant: small-caps;
        text-decoration: underline;
    }
    div > :global(p):nth-child(2) {
        margin-top: 0.25em;
    }
</style>
