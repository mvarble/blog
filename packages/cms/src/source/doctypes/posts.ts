import { touchPost, type TouchPostInput } from '../../db';
import { hasDateField, hasObjectField, hasStringField, slugFromFilename } from '../../util';
import { nodeParser } from '../parsers';
import { type FileHooks } from '..';

const hooks: FileHooks = {
    async initialize(db, filename, frontmatter, contents) {
        // touch post data
        const input = parsePostInput(filename, frontmatter);
        if (!input) return;
        const post = touchPost(db, input);

        // parse the mdast
        await nodeParser(
            db,
            {
                mddocId: post.mddocId,
                root: post.mddocId,
                relevantPageId: post.pageId,
                pathname: post.pathname,
                filename,
            },
            contents,
            0,
            undefined,
        );
    },
};

function parsePostInput(
    filename: string,
    frontmatter: Record<'type', string>,
): TouchPostInput | undefined {
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
    return {
        title: frontmatter.title,
        created: frontmatter.created,
        slug,
        edited,
        filename,
        katexMacros,
    };
}

export default hooks;
