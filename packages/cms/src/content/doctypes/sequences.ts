import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

import {
    type Database,
    type Sequence,
    type TouchSequenceChildInput,
    touchSequence,
} from '../../db';
import { Frontmatter } from '../frontmatter';
import { hasBooleanField } from '../../util';
import { headingParser, nodeParser } from '../parsers';
import { Numbering } from '../../model/build';
import { type FileHooks } from '.';

const hooks: FileHooks = {
    initialize(db, filename, frontmatter, contents) {
        const fm = new Frontmatter(filename, frontmatter, 'Sequence');
        const created = fm.requiredDate('created');
        const enumerate = fm.optionalBoolean('enumerate', false);

        // `children` is a tree of pages, each described by a file the sequence
        // points at; a page's own frontmatter supplies its title and slug.
        const declared = fm.optionalArray('children');
        const children = declared ? buildChildren(filename, declared, false, true) : undefined;
        if (declared && !children) return;
        if (!fm.valid()) return;

        const sequence = touchSequence(db, {
            title: fm.requiredString('title'),
            slug: fm.slug(),
            created,
            edited: fm.optionalDate('edited', created),
            descriptionFilename: fm.optionalPath('description'),
            imageFilename: fm.optionalPath('image'),
            katexMacros: fm.katexMacros(),
            tags: fm.optionalStrings('tags'),
            enumerate,
            children,
            filename,
        });

        numberSequence(db, sequence, contents, enumerate);
    },
};

// Walks the sequence in reading order, numbering its statements and equations
// as it goes. `Numbering` owns when the count restarts; this only has to visit
// the pages in the order a reader meets them.
function numberSequence(db: Database, sequence: Sequence, contents: string, enumerate: boolean) {
    const numbering = new Numbering(enumerate ? '0' : undefined);
    headingParser(db, sequence.mddocId, contents);
    nodeParser(
        db,
        {
            mddocId: sequence.mddocId,
            root: sequence.mddocId,
            relevantPageId: sequence.pageId,
            pathname: sequence.pathname,
            filename: sequence.filename,
        },
        contents,
        numbering,
    );

    const descendants = (sequence.children ?? []).toReversed();
    while (descendants.length > 0) {
        const descendant = descendants.pop()!;
        const descendantContents = fs.readFileSync(descendant.filename, 'utf8');
        numbering.enter(descendant.label);
        headingParser(db, descendant.mddocId, descendantContents);
        nodeParser(
            db,
            {
                mddocId: descendant.mddocId,
                root: sequence.mddocId,
                relevantPageId: descendant.pageId,
                pathname: descendant.pathname,
                filename: descendant.filename,
            },
            descendantContents,
            numbering,
        );
        if (descendant.children) {
            descendants.push(...descendant.children.toReversed());
        }
    }
}

function buildChildren(
    rootFilename: string,
    children: unknown[],
    appendixStart: boolean,
    topLevel: boolean,
): TouchSequenceChildInput[] | undefined {
    const out: TouchSequenceChildInput[] = [];
    let appendix = appendixStart;
    for (const child of children) {
        if (typeof child != 'object' || !child) {
            console.error(
                `${rootFilename}: each entry of \`children\` must be an object.`,
            );
            return;
        }
        // Once one top-level child is marked as an appendix, the rest are too.
        if (topLevel && !appendix && hasBooleanField(child, 'appendix') && child.appendix) {
            appendix = true;
        }

        const entry = new Frontmatter(rootFilename, child, 'Sequence child');
        const relative = entry.requiredString('filename');
        if (!entry.valid()) return;
        const filename = path.relative(
            path.resolve('.'),
            path.resolve(path.dirname(rootFilename), relative),
        );

        const page = new Frontmatter(
            filename,
            matter(fs.readFileSync(filename, 'utf8')).data,
            'Sequence page',
        );
        const title = page.requiredString('title');
        const slug = page.slug();
        const katexMacros = page.katexMacros();
        if (!page.valid()) return;

        const nested = entry.optionalArray('children');
        if (!nested) {
            out.push({ title, slug, filename, katexMacros, appendix });
            continue;
        }
        // A sequence is chapters and sections, and nothing below that. The table
        // of contents spends its third level on the headings within a page, so a
        // deeper page tree would have nowhere left to go.
        if (!topLevel) {
            console.error(
                `${rootFilename}: \`${relative}\` nests a third level of pages; ` +
                    'a sequence has chapters and sections only.',
            );
            return;
        }
        const grandchildren = buildChildren(rootFilename, nested, appendix, false);
        if (!grandchildren) return;
        out.push({ title, slug, filename, katexMacros, children: grandchildren, appendix });
    }
    return out;
}

export default hooks;
