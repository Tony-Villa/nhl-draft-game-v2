import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { redis } from '$lib/server/redis';

export const GET: RequestHandler = async ({ url }) => {
  const {searchParams} = url

  const cache = searchParams.get('cache')

  if(cache === 'prospects') {
    redis.del('top_prospects')
  }
	
  return new Response(String('Done'));
};