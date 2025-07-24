import { getStatementFromSlug, KatexMacros, touchStatementDependency } from '../../db';
import { hasArrayField, hasObjectField, hasStringField, slugFromFilename } from '../../util';
import { edgeParser } from '../parsers';
import { type FileHooks } from '..';

const hooks: FileHooks = {
    async crossReference(db, filename, frontmatter, contents) {
        let slug = slugFromFilename(filename);
        if (hasStringField(frontmatter, 'slug') && frontmatter.slug) {
            slug = frontmatter.slug;
        }
        const statement = getStatementFromSlug(db, slug);
        if (!statement) {
            return;
        }
        if (hasArrayField(frontmatter, 'dependencies')) {
            frontmatter.dependencies.forEach((dep) => {
                if (typeof dep != 'string' || !dep) {
                    console.error('Statement has dependency which is not a string: ', dep);
                    return;
                }
                const childStatement = getStatementFromSlug(db, dep);
                if (!childStatement) {
                    console.error(`Statement has dependency '${dep}' which does not exist.`);
                    return;
                }
                touchStatementDependency(db, statement.id, childStatement.id);
            });
        }

        edgeParser(
            db,
            { id: statement.pageId, pathname: statement.pathname, filename: statement.filename },
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
