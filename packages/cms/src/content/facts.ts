import {
    type Database,
    foldKatexMacros,
    getCitationReferences,
    getEquationReferences,
    getHeadings,
    getMddoc,
    getPageReferences,
    getRelevantPathname,
    getStatementFromFilename,
    getStatementReferences,
} from '../db';

// Every filename the content layer knows about, in a stable order.
export function getMddocFilenames(db: Database): string[] {
    return (
        db.prepare('SELECT filename FROM mddocs ORDER BY filename;').all() as {
            filename: string;
        }[]
    ).map(({ filename }) => filename);
}

// A digest of everything the mdsvex plugins and the ESM injection read for a
// single document -- and nothing else. Surrogate keys are deliberately left
// out: they are an implementation detail of the database, so including them
// would make every document look changed whenever ids shifted, which is
// exactly the signal we are trying to isolate.
export function getDocumentFacts(db: Database, filename: string): string {
    const mddoc = getMddoc(db, filename);
    if (!mddoc) return '';

    const statement = getStatementFromFilename(db, filename);

    return JSON.stringify({
        pathname: getRelevantPathname(db, mddoc.id),
        macros: foldKatexMacros(db, mddoc.id, mddoc.katexMacros),
        // `remarkCms` rewrites link text from these.
        citations: getCitationReferences(db, mddoc.id)
            .map(({ key, label, pathname }) => [key, label, pathname])
            .sort(),
        equations: getEquationReferences(db, mddoc.id)
            .map(({ ref, label, pathname }) => [ref, label, pathname])
            .sort(),
        statements: getStatementReferences(db, mddoc.id)
            .map(({ ref, label, kind, full, pathname }) => [ref, label, kind, full, pathname])
            .sort(),
        pages: getPageReferences(db, mddoc.id)
            .map((ref) => [
                ref.pathname,
                ref.full,
                'title' in ref ? ref.title : null,
                'label' in ref ? ref.label : null,
                'sequence' in ref ? ref.sequence : null,
            ])
            .sort(),
        // `rehypeCms` turns these into the `id`s on the rendered headings, and
        // the table of contents links to them.
        headings: getHeadings(db, mddoc.id).map(({ depth, title, slug }) => [depth, title, slug]),
        // `cmsInjection` appends this to the compiled module.
        self: statement
            ? { kind: statement.kind, label: statement.label, slug: statement.slug }
            : null,
    });
}

export function getAllDocumentFacts(db: Database): Map<string, string> {
    const facts = new Map<string, string>();
    for (const filename of getMddocFilenames(db)) {
        facts.set(filename, getDocumentFacts(db, filename));
    }
    return facts;
}

// Filenames whose rendered facts differ between two builds, including
// documents that appeared or disappeared.
export function diffDocumentFacts(
    before: Map<string, string>,
    after: Map<string, string>,
): string[] {
    const changed: string[] = [];
    for (const [filename, hash] of after) {
        if (before.get(filename) !== hash) changed.push(filename);
    }
    for (const filename of before.keys()) {
        if (!after.has(filename)) changed.push(filename);
    }
    return changed;
}
