import path from 'path';
import { type Root } from 'mdast';
import { type Plugin } from 'unified';
import { type VFile } from 'vfile';
import type { KatexOptions } from 'katex';

import { hasStringField } from './plugin/typechecks';
import { connect, getPage, getReferences, foldKatexMacros, getCitations } from './db';
import { visitReferences, resolvePathname } from './plugin/page_references';
import rehypeKatexSvelte from 'rehype-katex-svelte';

export const remarkCms: Plugin<[undefined], Root, Root> = () => {
    return (mdast: Root, vfile: VFile) => {
        if (!hasStringField(vfile, 'filename')) {
            throw 'VFile has no filename.';
        }
        const filename = path.relative('.', vfile.filename);
        const db = connect();

        // format all references
        const page = getPage(db, filename);
        if (!page) return;
        const references = getReferences(db, page.id);
        const citations = Object.fromEntries(
            getCitations(db).map((citation) => [citation.key, citation]),
        );
        visitReferences(mdast, (node) => {
            // if we have `/citations#key`, we try to resolve as a citation
            if (node.url.startsWith('/citations#')) {
                const key = node.url.slice('/citations#'.length);
                const citation = citations[key];
                if (!citation) return;
                if (node.children.length == 1 && node.children[0].type == 'text') {
                    node.children[0].value = `${key}, ${node.children[0].value}`;
                } else if (!node.children.length) {
                    node.children = [{ type: 'text', value: key }];
                }
                return;
            }

            // make sure there is some text to potentially replace
            if (node.children.length != 1 || node.children[0].type != 'text') return;
            const child = node.children[0];

            // resolve the pathname in the way it is shoved into the database
            const pathname = resolvePathname(page.pathname, node.url);
            if (!pathname) return;

            // otherwise, we try to resolve as a page
            const ref = references[pathname];
            if (!ref) return;

            // perform replacement
            if (hasStringField(ref, 'title')) {
                child.value = child.value.replaceAll('%title', ref.title);
            }
            if (hasStringField(ref, 'item')) {
                child.value = child.value.replaceAll('%item', ref.item);
            }
            if (hasStringField(ref, 'kind')) {
                child.value = child.value.replaceAll('%kind', ref.kind);
            }
            if (hasStringField(ref, 'sequence')) {
                child.value = child.value.replaceAll('%sequence', ref.sequence);
            }
            if (hasStringField(ref, 'label')) {
                child.value = child.value.replaceAll('%label', ref.label);
            }
        });

        // put the KaTeX macros in the VFile
        vfile.data.katexMacros = foldKatexMacros(db, page.id, page.katexMacros);
    };
};

export const rehypeCms: Plugin<[KatexOptions], Root, Root> = (options) => {
    return (tree, vfile) => {
        // @ts-expect-error: rehypeKatexSvelte actually matches this API
        rehypeKatexSvelte({
            macros: {
                ...(options?.macros || {}),
                ...(vfile.data.katexMacros || {}),
            },
        })(tree);
    };
};
