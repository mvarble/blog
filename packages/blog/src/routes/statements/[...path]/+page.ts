import { error, type Load } from '@sveltejs/kit';

import modules from '$lib/modules';

export const load: Load = async ({ data }) => {
	const filename = (data as { filename: string }).filename;
	const loader = modules[filename];
	if (!loader) {
		error(404, { message: `Not found ${filename}` });
	}
	const module = await loader();
	return { component: module.default };
};
