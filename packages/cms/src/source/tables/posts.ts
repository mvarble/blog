import { getPage, touchPost } from '../../db';
import { hasDateField, hasObjectField, hasStringField, slugFromFilename } from '../../util';
import { nodeParser, edgeParser } from '../parsers';
import { type FileHooks } from '..';

const hooks: FileHooks = {
    async initialize(db, filename, frontmatter, contents) {
        // touch post data from frontmatter
        if (!hasStringField(frontmatter, 'title') || !frontmatter.title) {
            console.error('Posts must have a `title` string-field in the frontmatter.');
            return;
        }
        let slug = slugFromFilename(filename);
        if (hasStringField(frontmatter, 'slug') && frontmatter.slug) {
            slug = frontmatter.slug;
        }
        let katexMacros = {};
        if (hasObjectField(frontmatter, 'katex_macros') && frontmatter.katex_macros) {
            katexMacros = frontmatter.katex_macros;
        }
        if (!hasDateField(frontmatter, 'created')) {
            console.error('Posts must have a `created` date-field.');
            return;
        }
        let edited: Date = frontmatter.created;
        if (hasDateField(frontmatter, 'edited')) {
            edited = frontmatter.edited;
        }

        const post = touchPost(db, {
            title: frontmatter.title,
            created: frontmatter.created,
            slug,
            edited,
            filename,
            katexMacros,
        });

        // parse the mdast
        await nodeParser(
            db,
            { id: post.pageId, pathname: post.pathname, filename },
            contents,
            post.pageId,
            undefined,
        );
    },

    async crossReference(db, filename, _frontmatter, contents) {
        const page = getPage(db, filename);
        if (page) {
            edgeParser(db, page, contents);
        }
    },
};

export default hooks;
