import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

import {
    type TouchSequenceChildInput,
    type SequenceChildBase,
    type Database,
    touchSequence,
    getParentSequence,
} from '../../db';
import {
    hasArrayField,
    hasBooleanField,
    hasDateField,
    hasObjectField,
    hasStringField,
    slugFromFilename,
} from '../../util';
import { edgeParser, nodeParser } from '../parsers';
import { type FileHooks } from '..';

const hooks: FileHooks = {
    async initialize(db, filename, frontmatter, contents) {
        await initialize(db, filename, frontmatter, contents);
    },

    async crossReference(db, filename, _frontmatter, contents) {
        await crossReference(db, filename, contents);
    },

    async hmr(db, filename, frontmatter, contents) {
        await initialize(db, filename, frontmatter, contents);
        await crossReference(db, filename, contents);
    },
};

async function initialize(
    db: Database,
    filename: string,
    frontmatter: Record<'type', string>,
    contents: string,
) {
    if (!hasStringField(frontmatter, 'title') || !frontmatter.title) {
        console.error('Sequences must have a `title` string-field in the frontmatter.');
        return;
    }

    let slug = slugFromFilename(filename);
    if (hasStringField(frontmatter, 'slug') && frontmatter.slug) {
        slug = frontmatter.slug;
    }

    if (!hasDateField(frontmatter, 'created')) {
        console.error('Sequences must have a `created` date-field.');
        return;
    }
    let edited: Date = frontmatter.created;
    if (hasDateField(frontmatter, 'edited')) {
        edited = frontmatter.edited;
    }

    // check frontmatter for enumerate (optional or boolean)
    if ('enumerate' in frontmatter && !hasBooleanField(frontmatter, 'enumerate')) {
        console.error('Sequences field `enumerate` must be boolean.');
        return;
    }
    let enumerate = false;
    if (hasBooleanField(frontmatter, 'enumerate')) {
        enumerate = frontmatter.enumerate;
    }

    // check frontmatter for katex macros (optional or object)
    let katexMacros = {};
    if (hasObjectField(frontmatter, 'katex_macros') && frontmatter.katex_macros) {
        katexMacros = frontmatter.katex_macros;
    }

    // if frontmatter does not have children, then the sequence is done
    if (!('children' in frontmatter)) {
        const sequence = touchSequence(db, {
            title: frontmatter.title,
            slug,
            created: frontmatter.created,
            edited,
            filename,
            enumerate,
            katexMacros,
        });

        await nodeParser(
            db,
            {
                mddocId: sequence.mddocId,
                relevantPageId: sequence.pageId,
                pathname: sequence.pathname,
                filename: sequence.filename,
            },
            contents,
            0,
            enumerate ? '0' : undefined,
        );

        return;
    }

    // ensure the children are presented as an array; check each child and short-circuit if any fail
    if (!hasArrayField(frontmatter, 'children')) {
        console.error('Sequences field `children` must be an array of objects.');
        return;
    }

    const children = await buildChildren(filename, frontmatter.children, false, true);
    if (!children) {
        return;
    }

    const sequence = touchSequence(db, {
        title: frontmatter.title,
        slug,
        created: frontmatter.created,
        edited,
        filename,
        enumerate,
        katexMacros,
        children,
    });

    let currentItemPrefix = enumerate ? '0' : undefined;
    let currentItem = await nodeParser(
        db,
        {
            mddocId: sequence.mddocId,
            relevantPageId: sequence.pageId,
            pathname: sequence.pathname,
            filename: sequence.filename,
        },
        contents,
        0,
        currentItemPrefix,
    );

    const descendants = sequence.children!.toReversed();
    while (descendants.length > 0) {
        const descendant = descendants.pop()!;
        if (typeof descendant.label == 'string' && descendant.label != currentItemPrefix) {
            currentItem = 0;
            currentItemPrefix = descendant.label;
        }
        const contents = await fs.promises.readFile(descendant.filename, 'utf8');
        currentItem += await nodeParser(
            db,
            {
                mddocId: descendant.mddocId,
                relevantPageId: descendant.pageId,
                pathname: descendant.pathname,
                filename: descendant.filename,
            },
            contents,
            currentItem,
            currentItemPrefix,
        );
        if (descendant.children) {
            descendants.push(...descendant.children.toReversed());
        }
    }
}

async function crossReference(db: Database, filename: string, contents: string) {
    const sequence = getParentSequence(db, filename);
    if (sequence) {
        async function recurseFile(child: SequenceChildBase, contents: string) {
            edgeParser(
                db,
                {
                    mddocId: child.mddocId,
                    relevantPageId: child.pageId,
                    pathname: child.pathname,
                    filename: child.filename,
                },
                contents,
            );
            if (child.children) {
                child.children.forEach(recurse);
            }
        }

        async function recurse(child: SequenceChildBase) {
            const file = await fs.promises.readFile(child.filename, 'utf8');
            await recurseFile(child, file);
        }

        await recurseFile(sequence, contents);
    }
}

async function buildChildren(
    rootFilename: string,
    children: unknown[],
    appendixStart: boolean,
    topLevel: boolean,
): Promise<TouchSequenceChildInput[] | undefined> {
    const out: TouchSequenceChildInput[] = [];
    let appendix = appendixStart;
    for (const child of children) {
        if (typeof child != 'object' || !child) {
            console.error('Each descendant in the sequences field `children` must be an object.');
            return;
        }
        if (topLevel && !appendix && hasBooleanField(child, 'appendix') && child.appendix) {
            appendix = true;
        }
        if (!hasStringField(child, 'filename') || !child.filename) {
            console.error(
                'Each descendant in the sequences field `children` must have a string-field `filename`.',
            );
            return;
        }
        const filename = path.relative(
            path.resolve('.'),
            path.resolve(path.dirname(rootFilename), child.filename),
        );
        const frontmatter = matter(await fs.promises.readFile(filename, 'utf8')).data;

        if (!hasStringField(frontmatter, 'title') || !frontmatter.title) {
            console.error('Sequence pages must have a `title` string-field in the frontmatter.');
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

        if (!('children' in child)) {
            out.push({
                title: frontmatter.title,
                slug,
                filename,
                katexMacros,
                appendix,
            });
            continue;
        }

        if (!hasArrayField(child, 'children')) {
            console.error('Sequences field `children` must be an array of objects.');
            return;
        }

        const children = await buildChildren(rootFilename, child.children, appendix, false);
        if (!children) {
            return;
        }
        out.push({
            title: frontmatter.title,
            slug,
            filename,
            katexMacros,
            children,
            appendix,
        });
    }
    return out;
}

export default hooks;
