# blog

This is the repository for the source code (and post content) of my personal blog, hosted at [rodent.club](https://rodent.club).

## How it is done

My website is built with SvelteKit and a lightweight content-management layer I custom built.
The purpose of the content-management layer is to allow me to cross-reference content throughout the site _within_ the markdown documents that source the data.
Mdsvex is a useful type of markdown document which gives me hooks into the build-system and client-runtime, so my solution was to leverage this by having a content layer which is accessible within the build-system.
However, this means the build-system must be self aware of the files going into it, which requires some Vite plugin magic.

So that is basically it.

- [cms](./packages/cms) is a package which makes the Vite plugin which sets up hot-updating of a SQLite3 database from the markdown documents.
  It also provides the mdsvex plugin to provide custom markup when cross-referencing inside a document.
  Its source is layered as `content/` (reading and parsing documents), `model/` (the rules that decide labels, as plain functions over plain data), `db/` (the SQLite projection everything is queried from), `plugins/` (the Vite and mdsvex integrations), and `entries/` (the three published entry points).
  Citations are keyed globally; statements and equations are scoped to their post or sequence.
- [blog](./packages/blog) is a regular SvelteKit app which builds pages from the content-management system and the markdown documents in [the content directory](./packages/blog/src/content).

## Notes on markup

The custom markup I introduce is not fancy enough for me to write some sort of spec, so here are some notes on how we produce and consume data for the content layer within a markdown document.
Note that SQL schemas for the content layer are declared [here](./packages/cms/src/db/sql/up.sql).

### Creating posts

Any mdsvex document in the content directory with the following frontmatter will exist as a post.

```yaml
type: post
title: My cool post
slug: my-cool-post
```

The `slug` field must be unique and it serves as an identifier for the post; if not provided, it is assumed to be the filename without the extension or the directory name if the filename is `index.svx`.
An optional field `katex_macros` provides a map of LaTeX macros that will be used throughout the document.

### Creating sequences

A sequence always has a root page which is populated by a mdsvex document with the following frontmatter.

```yaml
type: sequence
title: My cool sequence
slug: my-cool-sequence
children:
  - filename: ./path/to/doc0.svx
  - filename: ./path/to/doc1.svx
    children:
      - filename: ./path/to/doc2.svx
  - filename: ./path/to/doc3.svx
```

The `slug` field must be unique and it serves as an identifier for the sequence; if not provided, it is assumed to be the filename without the extension or the directory name if the filename is `index.svx`.
The `children` field is an array serving as a tree-like structure: each of its children represents a page in the sequence, it must include a field `filename` specifying the content for the page, and it may itself include a `children` field which recurses the structure.

Any sequence page represented in `children` must have the following frontmatter.

```yaml
title: A page in my cool sequence
slug: some-page
```

The `slug` must be unique _within its parent_ and it serves as an identifier for the page among its siblings; if not provided, it is assumed to be the filename without the extension or the directory name if the filename is `index.svx`.
The sequence has an optional field `enumerate` which dictates whether the sequence pages have numbers at the front of them.
Just as with posts, the sequence and its pages also have optional frontmatter fields `katex_macros`, which fold through the children.
For example, if the sequence has the following frontmatter,

```yaml
# ... cut for brevity
katex_macros:
  \X: '\mathbb{X}'
```

then any sequence page will have the macro `\X`, since they are all children of the sequence.

### Creating a statement

A statement can be created anywhere within the content directory, so long as it has the following fields in its frontmatter.

```yaml
type: statement
kind: remark
slug: my-cool-remark
```

The `slug` field is the identifier we use to reference the statement; if not provided, it is assumed to be the filename without the extension or the directory name if the filename is `index.svx`.
It must be unique within its _scope_ — the post it belongs to, or the whole sequence if it lives in a sequence page — rather than across the entire site.
Two unrelated posts are therefore free to both call something `main-theorem`.
For a statement to be tracked on the website, it must exist within a post or sequence page.
To do this, import the mdsvex document as a svelte component within the page.

```svelte
<script>
  import * as remark from './path/to/remark.svx';
</script>
```

From there, the component can be rendered just like any other svelte component,

```svelte
<remark.default />
```

but it is better to use the `Sequence` component which renders relevant information from the content-management layer.

```svelte
<script>
  import Statement from '$lib/components/statement.svelte';
  import * as remark from './path/to/remark.svx';
</script>

<Statement {...remark} />
```

Just as with sequences, a statement will inherit the macros from the context in which it was introduced.

> **Note.** The content-management layer does not enforce a statement be owned solely by a unique parent.
> The responsibility is on the developer to only import it in one post or sequence page.

### Referencing a page, statement, or equation

Any time something is referenced on the site, the link text may be formatted with data from the content layer.
Pages are addressed by their pathname; statements and equations are addressed by slug through the `statement:` and `eq:` schemes.

```md
[%title](/posts/some-post)
[%full](statement:my-cool-remark)
[%label](eq:my-cool-equation)
```

A bare slug is resolved **within the scope of the document doing the referencing** — its post, or its sequence.
It is never looked up anywhere else, so a reference means the same thing no matter what exists elsewhere on the site.
To reach a statement or equation in another post or sequence, prefix the slug with that post or sequence's own slug.

```md
[%full](statement:some-other-post/main-theorem)
[%label](eq:my-cool-sequence/some-equation)
```

If a slug does not resolve, the build prints the referencing file, the scope it searched, and the prefixed form to use instead.

The link text is a format string with the following possible arguments.

| formatter   | data                                                                    | example(s)                    |
| ----------- | ----------------------------------------------------------------------- | ----------------------------- |
| `%title`    | Title, if a post or sequence page.                                      | `My cool post`                |
| `%label`    | Item of a page within a enumerated sequence or statement within a page. | `1`, `3.2`                    |
| `%kind`     | The kind of statement (if a statement), capitalized.                    | `Proposition`                 |
| `%sequence` | If sequence page, the title of the sequence.                            | `My cool sequence`            |
| `%full`     | If post or page in unenumerated sequence, `%title`.                     | `My cool post`                |
|             | If page in enumerated sequence, `%item. %title`                         | `1. Introduction`             |
|             | If statement, `%kind %item`                                             | `Proposition 1`, `Remark 3.2` |

In addition to parsing these format strings, the content layer will build a dependency graph of the various pages in the site for ease-of-browsing.

### Specifying statement dependencies

The automatic cross-referencing of pages can be cyclic in nature, where two pages reference one another.
Deductions between statements are specified more literally.
In the frontmatter of any statement, an optional field `dependencies` specifies other statements that may be used to deduce it.
This field is an array of statement slugs corresponding to the statements on which it depends.

```yaml
# ... cut for brevity
dependencies:
  - some-other-statement
```

### Creating a citation

In addition to "statements" on the site, the content layer also keeps track of BibTeX citations.
Any `.bib` file in the content directory will be parsed into the database (least some subset of the fields).
To reference a citation, use markdown links like so.

```md
[](cite:key)
[Theorem 21](cite:key)
```

This will work like LaTeX when using `\cite{key}` or `\cite[Theorem 21]{key}`, where the link text will render as some tag like `Lastname25` and `Theorem 21, Lastname25`, respectively.
