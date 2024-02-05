import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	const { data } = await request.json();
	// console.log('draftboard: ', data);

	return json({ message: 'success' });
}
