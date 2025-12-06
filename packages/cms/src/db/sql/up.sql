-- Markdown-driven content on the website.
CREATE TABLE IF NOT EXISTS mddocs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    root INTEGER REFERENCES mddocs(id),
    katex_macros TEXT
);

-- Page on the website; always associated with a markdown document.
CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    pathname TEXT UNIQUE NOT NULL
);

-- The markdown document associated with a page may import other markdown
-- documents whose content we manage.
CREATE TABLE IF NOT EXISTS page_mddocs (
    parent_page_id INTEGER NOT NULL REFERENCES pages(id),
    imported_mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    UNIQUE (parent_page_id, imported_mddoc_id)
);

-- Posts are pages on the website which are primarily self-contained.
CREATE TABLE IF NOT EXISTS posts (
    page_id INTEGER NOT NULL REFERENCES pages(id),
    description_id INTEGER REFERENCES mddocs(id),
    image_filename TEXT,
    title TEXT NOT NULL,
    created DATE NOT NULL,
    edited DATE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- Sequences are collections of pages on the website which are organized in a
-- tree-like structure, similar to a book. The foreign-key is the "root" page
-- from which all other pages within the sequence descend.
CREATE TABLE IF NOT EXISTS sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id),
    description_id INTEGER REFERENCES mddocs(id),
    image_filename TEXT,
    title TEXT NOT NULL,
    created DATE NOT NULL,
    edited DATE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    enumerate BOOLEAN NOT NULL DEFAULT FALSE
);

-- Position information of a non-root page within a sequence.
CREATE TABLE IF NOT EXISTS sequence_pages (
    sequence_id INTEGER NOT NULL REFERENCES sequences(id),
    page_id INTEGER NOT NULL REFERENCES pages(id),
    parent_page_id INTEGER REFERENCES pages(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    item INTEGER NOT NULL,
    appendix BOOLEAN NOT NULL,
    label TEXT
);

-- Statements encapsulate information within a page which may easily be
-- referenced elsewhere on the site. Each statement is owned by a single page,
-- and thus has a label determined by its position within the page. This
-- promotes easier readability.
CREATE TABLE IF NOT EXISTS statements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    slug TEXT UNIQUE NOT NULL,
    label TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL
);

-- Equations within a page can be numbered and referenced throughout the site.
CREATE TABLE IF NOT EXISTS equations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    parent_page_id INTEGER NOT NULL REFERENCES pages(id),
    slug TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL
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

-- Track whenever a document references a page.
CREATE TABLE IF NOT EXISTS page_refs (
    source_mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    target_page_id INTEGER NOT NULL REFERENCES pages(id),
    UNIQUE (source_mddoc_id, target_page_id)
);

-- Track whenever a document references a statement.
CREATE TABLE IF NOT EXISTS statement_refs (
    source_mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    target_statement_id INTEGER NOT NULL REFERENCES statements(id),
    UNIQUE (source_mddoc_id, target_statement_id)
);

-- Track whenever a document references an equation.
CREATE TABLE IF NOT EXISTS equation_refs (
    source_mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    target_equation_id INTEGER NOT NULL REFERENCES equations(id),
    UNIQUE (source_mddoc_id, target_equation_id)
);

-- Track whenever a document makes a citation.
CREATE TABLE IF NOT EXISTS citation_refs (
    source_mddoc_id INTEGER NOT NULL REFERENCES mddocs(id),
    target_citation_id INTEGER NOT NULL REFERENCES citations(id),
    UNIQUE (source_mddoc_id, target_citation_id)
);
