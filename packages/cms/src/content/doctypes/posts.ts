import { touchPost, type TouchPostInput } from '../../db';
import { Frontmatter } from '../frontmatter';
import { nodeParser } from '../parsers';
import { type FileHooks } from '.';

const hooks: FileHooks = {
    initialize(db, filename, frontmatter, contents) {
        const input = parsePostInput(filename, frontmatter);
        if (!input) return;
        const post = touchPost(db, input);

        nodeParser(
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
    const fm = new Frontmatter(filename, frontmatter, 'Post');
    const created = fm.requiredDate('created');
    const input: TouchPostInput = {
        title: fm.requiredString('title'),
        slug: fm.slug(),
        created,
        edited: fm.optionalDate('edited', created),
        descriptionFilename: fm.optionalPath('description'),
        imageFilename: fm.optionalPath('image'),
        katexMacros: fm.katexMacros(),
        tags: fm.optionalStrings('tags'),
        filename,
    };
    return fm.valid() ? input : undefined;
}

export default hooks;
