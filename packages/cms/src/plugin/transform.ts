import { Plugin } from 'vite';
import path from 'path';

import { connect, getStatementFromFilename } from '../db';

export default function cmsInjectionPlugin(): Plugin {
    const db = connect();
    return {
        name: 'cms-injection',
        version: '0.0.1',
        enforce: 'post',
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
