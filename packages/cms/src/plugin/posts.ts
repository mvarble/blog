import { getPage, touchPost, touchStatement } from '../db';
import { mdastParser, type FileHooks } from '.';
import { hasObjectField, hasStringField } from './typechecks';
import { getStatements } from './statements';
import { findReferences } from './page_references';

const hooks: FileHooks = {
    async initialize(db, filename, frontmatter, contents) {
        // touch post data from frontmatter
        if (!hasStringField(frontmatter, 'title') || !frontmatter.title) {
            console.error('Posts must have a `title` string-field in the frontmatter.');
            return;
        }
        if (!hasStringField(frontmatter, 'slug') || !frontmatter.slug) {
            console.error('Posts must have a `slug` string-field in the frontmatter.');
            return;
        }
        let katexMacros = {};
        if (hasObjectField(frontmatter, 'katex_macros') && frontmatter.katex_macros) {
            katexMacros = frontmatter.katex_macros;
        }
        const post = touchPost(db, {
            title: frontmatter.title,
            slug: frontmatter.slug,
            filename,
            katexMacros,
        });

        // get statements from content
        const statements = await getStatements(post.pageId, filename, contents, 0);
        statements.forEach((statement) => touchStatement(db, statement));
    },

    async crossReference(db, filename, _frontmatter, contents) {
        const page = getPage(db, filename);
        if (page) {
            const mdast = mdastParser.parse(contents);
            findReferences(db, page, mdast);
        }
    },
};

export default hooks;
