import { Plugin } from 'vite';
import path from 'path';

import { connect, getStatementFromFilename } from '../db';

// TODO: get all tag data
export function cmsInjection(): Plugin {
    const db = connect();
    return {
        name: 'cms-injection',
        version: '0.0.1',
        enforce: 'post',
        // https://vite.dev/guide/api-plugin.html#transforming-custom-file-types
        transform(code, id) {
            if (!id.endsWith('.svx')) return;
            const filename = path.relative('.', id);
            const statement = getStatementFromFilename(db, filename);
            if (!statement) return { code };
            return {
                code: code + `\nexport const cms = ${JSON.stringify(statement)}`,
            };
        },
    };
}
