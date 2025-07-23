<script>
    import '../styles/index.css';
    let { children } = $props();
</script>

<a href="/posts">posts</a>
<a href="/sequences">sequences</a>
<a href="/statements">statements</a>
<a href="/citations">bibliography</a>

{@render children()}
