import path from 'path';

import {
    hasArrayField,
    hasBooleanField,
    hasDateField,
    hasObjectField,
    hasStringField,
    slugFromFilename,
} from '../util';
import { type KatexMacros } from '../db';

// Posts, sequences and sequence pages describe themselves with nearly the same
// frontmatter fields, and each used to re-implement the checks -- returning on
// the first problem, with a message that named neither the file nor, in some
// cases, the field.
//
// A reader collects every problem it finds instead of stopping at the first, so
// one save reports everything wrong with a document, each message carrying the
// filename.
export class Frontmatter {
    private readonly problems: string[] = [];

    constructor(
        readonly filename: string,
        private readonly data: object & {},
        private readonly kind: string,
    ) {}

    private reject(field: string, expected: string) {
        this.problems.push(
            `${this.filename}: ${this.kind} field \`${field}\` must be ${expected}.`,
        );
    }

    has(field: string): boolean {
        return field in this.data;
    }

    requiredString(field: string): string {
        if (!hasStringField(this.data, field) || !this.data[field]) {
            this.reject(field, 'a non-empty string');
            return '';
        }
        return this.data[field];
    }

    requiredDate(field: string): Date {
        if (!hasDateField(this.data, field)) {
            this.reject(field, 'a date');
            return new Date(0);
        }
        return this.data[field];
    }

    optionalDate(field: string, fallback: Date): Date {
        if (!this.has(field)) return fallback;
        return this.requiredDate(field);
    }

    optionalBoolean(field: string, fallback: boolean): boolean {
        if (!this.has(field)) return fallback;
        if (!hasBooleanField(this.data, field)) {
            this.reject(field, 'a boolean');
            return fallback;
        }
        return this.data[field];
    }

    optionalStrings(field: string): string[] | undefined {
        if (!this.has(field)) return undefined;
        if (
            !hasArrayField(this.data, field) ||
            this.data[field].some((item) => typeof item != 'string')
        ) {
            this.reject(field, 'a list of strings');
            return undefined;
        }
        return this.data[field] as string[];
    }

    optionalArray(field: string): unknown[] | undefined {
        if (!this.has(field)) return undefined;
        if (!hasArrayField(this.data, field)) {
            this.reject(field, 'an array');
            return undefined;
        }
        return this.data[field];
    }

    katexMacros(): KatexMacros {
        if (!hasObjectField(this.data, 'katex_macros') || !this.data.katex_macros) return {};
        return this.data.katex_macros as KatexMacros;
    }

    // Defaults to the filename, or to the directory name for an `index` file,
    // which is what most documents rely on.
    slug(): string {
        if (hasStringField(this.data, 'slug') && this.data.slug) return this.data.slug;
        return slugFromFilename(this.filename);
    }

    // A path written relative to the document, resolved against the project root
    // the same way the content glob reports filenames.
    optionalPath(field: string): string | undefined {
        if (!this.has(field)) return undefined;
        if (!hasStringField(this.data, field)) {
            this.reject(field, 'a string path');
            return undefined;
        }
        return path.relative(
            path.resolve('.'),
            path.resolve(path.dirname(this.filename), this.data[field]),
        );
    }

    // Reports everything that was wrong, and answers whether the document is
    // usable. Callers bail out when this is false.
    valid(): boolean {
        for (const problem of this.problems) console.error(problem);
        return this.problems.length == 0;
    }
}
