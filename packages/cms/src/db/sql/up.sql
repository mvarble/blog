-- A page encapsulates the minimal information for a page of markdown-driven
-- content on the website.
CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    pathname TEXT UNIQUE NOT NULL,
    katex_macros TEXT NOT NULL
);

-- Any time a page links to another, we add an edge between them.
CREATE TABLE IF NOT EXISTS page_references (
    parent_id INTEGER NOT NULL REFERENCES pages(id),
    child_id INTEGER NOT NULL REFERENCES pages(id),
    UNIQUE (parent_id, child_id)
);

-- An item worth numbering for reference within a document
CREATE TABLE IF NOT EXISTS tags (
    parent_id INTEGER NOT NULL REFERENCES pages(id),
    slug TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL
);

-- Any time a file links to another, we add an edge between them.
CREATE TABLE IF NOT EXISTS tag_references (
    parent_id TEXT NOT NULL REFERENCES pages(id),
    child_slug TEXT NOT NULL REFERENCES tags(slug),
    UNIQUE (parent_id, child_slug)
);

-- A post encapsulates a self-contained page on the site.
CREATE TABLE IF NOT EXISTS posts (
    page_id INTEGER NOT NULL REFERENCES pages(id),
    title TEXT NOT NULL,
    created DATE NOT NULL,
    edited DATE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- A sequence encapsulates a collection of pages organized in a tree-like
-- structure, similar to a book. The foreign-key is the "root" page.
CREATE TABLE IF NOT EXISTS sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id),
    title TEXT NOT NULL,
    created DATE NOT NULL,
    edited DATE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    enumerate BOOLEAN NOT NULL DEFAULT FALSE
);

-- The position information of a page within a sequence.
CREATE TABLE IF NOT EXISTS sequence_pages (
    page_id INTEGER NOT NULL REFERENCES pages(id),
    sequence_id INTEGER NOT NULL REFERENCES sequences(id),
    parent_id INTEGER REFERENCES pages(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    item INTEGER NOT NULL,
    appendix BOOLEAN NOT NULL,
    label TEXT
);

-- A statement encapsulates information which I would like to deductively
-- track. Each statement is introduced in a page. A statement may be referenced
-- by its index of its occurence in the page (i.e. 0, 1, 2, ...), much like in
-- LaTeX.
CREATE TABLE IF NOT EXISTS statements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id),
    parent_id INTEGER NOT NULL REFERENCES pages(id),
    kind TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    label TEXT UNIQUE NOT NULL
);

-- A statement may depend on another one, indicating the deductive flow.
CREATE TABLE IF NOT EXISTS statement_dependencies (
    parent_id INTEGER NOT NULL REFERENCES statements(id),
    child_id INTEGER NOT NULL REFERENCES statements(id),
    UNIQUE(parent_id, child_id)
);

-- A bibtex reference.
CREATE TABLE IF NOT EXISTS citations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    year TEXT NOT NULL,
    doi TEXT,
    publisher TEXT,
    issn TEXT,
    isbn TEXT,
    journal TEXT,
    number TEXT,
    pages TEXT,
    volume TEXT,
    institution TEXT,
    edition TEXT,
    url TEXT,
    series TEXT
);

-- Authors within a bibtex reference.
CREATE TABLE IF NOT EXISTS citation_authors (
    citation_id INTEGER NOT NULL REFERENCES citations(id),
    item INTEGER NOT NULL,
    lastname TEXT NOT NULL,
    fullname TEXT NOT NULL
);
