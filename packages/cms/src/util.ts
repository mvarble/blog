import path from 'path';

export const tagRegex = /@tag\(([a-zA-Z-_0-9]+)\)/g;

export function slugFromFilename(filename: string): string {
    const basename = path.basename(filename);
    const extname = path.extname(basename);
    const name = extname ? basename.slice(0, -extname.length) : basename;
    if (name != 'index') return name;
    const dirname = path.dirname(filename);
    return dirname.split(path.sep).at(-1)!;
}

export function hasNumberField<Obj extends object & {}, K extends PropertyKey>(
    obj: Obj,
    key: K,
): obj is Obj & Record<K, number> {
    // @ts-expect-error: cannot narrow variable to have key K
    return typeof obj[key] == 'number';
}

export function hasStringField<Obj extends object & {}, K extends PropertyKey>(
    obj: Obj,
    key: K,
): obj is Obj & Record<K, string> {
    // @ts-expect-error: cannot narrow variable to have key K
    return typeof obj[key] == 'string';
}

export function hasObjectField<Obj extends object & {}, K extends PropertyKey>(
    obj: Obj,
    key: K,
): obj is Obj & Record<K, object> {
    // @ts-expect-error: cannot narrow variable to have key K
    return typeof obj[key] == 'object';
}

export function hasBooleanField<Obj extends object & {}, K extends PropertyKey>(
    obj: Obj,
    key: K,
): obj is Obj & Record<K, boolean> {
    // @ts-expect-error: cannot narrow variable to have key K
    return typeof obj[key] == 'boolean';
}

export function hasArrayField<Obj extends object & {}, K extends PropertyKey>(
    obj: Obj,
    key: K,
): obj is Obj & Record<K, unknown[]> {
    // @ts-expect-error: cannot narrow variable to have key K
    return Array.isArray(obj[key]);
}

export function hasDateField<Obj extends object & {}, K extends PropertyKey>(
    obj: Obj,
    key: K,
): obj is Obj & Record<K, Date> {
    return (
        // @ts-expect-error: cannot narrow variable to have key K
        typeof obj[key] == 'object' &&
        // @ts-expect-error: cannot narrow variable to have key K
        'toISOString' in obj[key] &&
        typeof obj[key].toISOString == 'function'
    );
}

export function resolvePathname(base: string, rel: string): string | undefined {
    if (rel.startsWith('tag:')) {
        return rel;
    }
    if (rel.startsWith('/')) {
        return rel.slice(1);
    }
    if (rel.startsWith('.')) {
        return path.join(base, rel);
    }
}

export function buildLabel(item: number, itemPrefix?: string): string {
    return typeof itemPrefix == 'string' ? `${itemPrefix}.${item}` : `${item}`;
}
