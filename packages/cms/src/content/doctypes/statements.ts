import { getPagePathname, getStatementFromFilename, KatexMacros } from '../../db';
import { hasObjectField, hasStringField, slugFromFilename } from '../../util';
import { edgeParser } from '../parsers';
import { type FileHooks } from '.';

const hooks: FileHooks = {
    crossReference(db, filename, _frontmatter, contents) {
        const statement = getStatementFromFilename(db, filename);
        if (!statement) {
            return;
        }
        const pathname = getPagePathname(db, statement.parentPageId);
        if (!pathname) {
            return;
        }
        edgeParser(
            db,
            {
                mddocId: statement.mddocId,
                root: statement.root,
                relevantPageId: statement.parentPageId,
                pathname,
                filename,
            },
            contents,
        );
    },
};

export function parseStatementFrontmatter(
    filename: string,
    frontmatter: Record<string, string>,
): { kind: string; filename: string; slug: string; katexMacros: KatexMacros } | undefined {
    if (!hasStringField(frontmatter, 'type') || frontmatter.type != 'statement') return;
    if (!hasStringField(frontmatter, 'kind') || !frontmatter.kind) return;
    let slug = slugFromFilename(filename);
    if (hasStringField(frontmatter, 'slug') && frontmatter.slug) {
        slug = frontmatter.slug;
    }
    let katexMacros = {};
    if (hasObjectField(frontmatter, 'katex_macros') && frontmatter.katex_macros) {
        katexMacros = frontmatter.katex_macros;
    }
    return {
        kind: frontmatter.kind,
        filename,
        slug,
        katexMacros,
    };
}

export default hooks;
