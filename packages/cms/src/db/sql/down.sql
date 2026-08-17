-- Empties every table without dropping it, so a reader connected during a
-- rebuild never observes a missing table. Children first, mirroring the
-- foreign keys.
DELETE FROM citation_refs;
DELETE FROM equation_refs;
DELETE FROM statement_refs;
DELETE FROM page_refs;
DELETE FROM citation_authors;
DELETE FROM citations;
DELETE FROM equations;
DELETE FROM statements;
DELETE FROM sequence_pages;
DELETE FROM sequences;
DELETE FROM posts;
DELETE FROM page_mddocs;
DELETE FROM tags;
DELETE FROM pages;
DELETE FROM mddocs;

-- `DELETE FROM` leaves the AUTOINCREMENT counters where they were, so without
-- this every rebuild would hand out fresh ids to unchanged content. Keeping
-- ids stable is what lets the dev server tell which documents actually changed.
DELETE FROM sqlite_sequence;
