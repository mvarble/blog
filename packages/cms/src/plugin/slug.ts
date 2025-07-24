import path from 'path';

export function slugFromFilename(filename: string): string {
    const basename = path.basename(filename);
    const extname = path.extname(basename);
    const name = extname ? basename.slice(0, -extname.length) : basename;
    if (name != 'index') return name;
    const dirname = path.dirname(filename);
    return dirname.split(path.sep).at(-1)!;
}
