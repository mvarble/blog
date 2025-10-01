import { writable } from 'svelte/store';

import type { DocumentSummary } from '$lib/types';

const tableOfContents = writable<DocumentSummary[]>([]);

export default tableOfContents;
