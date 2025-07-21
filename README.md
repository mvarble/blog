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

The `slug` field must be unique and it serves as an identifier for the post.
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

The `slug` field must be unique and it serves as an identifier for the sequence.
The `children` field is an array serving as a tree-like structure: each of its children represents a page in the sequence, it must include a field `filename` specifying the content for the page, and it may itself include a `children` field which recurses the structure.

Any sequence page represented in `children` must have the following frontmatter.

```yaml
title: A page in my cool sequence
slug: some-page
```

The `slug` must be unique _within its parent_ and it serves as an identifier for the page among its siblings.
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

The `slug` field must be unique, as it is the identifier we use to reference the statement.
For a statement to be tracked on the website, it must exist within a post or sequence page.
To do this, import the mdsvex document as a svelte component within the page.

```svelte
<script>
  import Remark from './path/to/remark.svx';
</script>
```

From there, the component can be rendered just like any other svelte component.
Just as with sequences, a statement will inherit the macros from the context in which it was introduced.

> **Note.** The content-management layer does not enforce a statement be owned solely by a unique parent.
> The responsibility is on the developer to only import it in one post or sequence page.

### Referencing a page

Any time a page is referenced on the site, the link text may be formatted with data from the content layer.
Here are some examples.

```md
[%title](/posts/some-post)
[%ident](/statements/my-cool-remark)
```

The link text is a format string with the following possible arguments.

| formatter   | data                                                                    | example(s)                    |
| ----------- | ----------------------------------------------------------------------- | ----------------------------- |
| `%title`    | Title, if a post or sequence page.                                      | `My cool post`                |
| `%item`     | Item of a page within a enumerated sequence or statement within a page. | `1`, `3.2`                    |
| `%kind`     | The kind of statement (if a statement), capitalized.                    | `Proposition`                 |
| `%sequence` | If sequence page, the title of the sequence.                            | `My cool sequence`            |
| `%label`    | If post or page in unenumerated sequence, `%title`.                     | `My cool post`                |
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
[](/citations#key)
[Theorem 21](/citations#key)
```

This will work like LaTeX when using `\cite{key}` or `\cite[Theorem 21]{key}`, where the link text will render as some tag like `Lastname25` and `Theorem 21, Lastname25`, respectively.
