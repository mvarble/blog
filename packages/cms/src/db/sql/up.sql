-- A page encapsulates the minimal information for a page of markdown-driven
-- content on the website.
CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pathname TEXT UNIQUE NOT NULL,
    filename TEXT UNIQUE NOT NULL,
    katex_macros TEXT NOT NULL
);

-- Any time a page links to another, we add an edge between them.
CREATE TABLE IF NOT EXISTS page_references (
    parent_id INTEGER NOT NULL REFERENCES pages(id),
    child_id INTEGER NOT NULL REFERENCES pages(id)
);

-- A post encapsulates a self-contained page on the site.
CREATE TABLE IF NOT EXISTS posts (
    page_id INTEGER NOT NULL REFERENCES pages(id),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- A sequence encapsulates a collection of pages organized in a tree-like
-- structure, similar to a book. The foreign-key is the "root" page.
CREATE TABLE IF NOT EXISTS sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id),
    title TEXT NOT NULL,
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
    item INTEGER NOT NULL
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
    item INTEGER NOT NULL,
    item_prefix INTEGER
);

-- A statement may depend on another one, indicating the deductive flow.
CREATE TABLE IF NOT EXISTS statement_dependencies (
    parent_id INTEGER NOT NULL REFERENCES statements(id),
    child_id INTEGER NOT NULL REFERENCES statements(id),
    UNIQUE(parent_id, child_id)
);
