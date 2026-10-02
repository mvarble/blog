import { redirect } from '@sveltejs/kit';

// Every sequence is listed on the home page, so the old listing sends readers
// there.
export const prerender = true;

export const load = () => redirect(308, '/#sequences');
