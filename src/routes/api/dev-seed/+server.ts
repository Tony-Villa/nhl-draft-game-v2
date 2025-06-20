import { json } from '@sveltejs/kit';
import { DataSeeder } from '$lib/server/seeders/data-seeder.js';
import { dev } from '$app/environment';

export async function POST({ request }) {
  // Safety check - only allow in development
  if (!dev) {
    return json({ 
      success: false, 
      message: 'Data seeding is only available in development mode' 
    }, { status: 403 });
  }

  try {
    const { action, gameId, numUsers, shouldCreateFullDraftboards } = await request.json();

    if (!action || !gameId) {
      return json({ 
        success: false, 
        message: 'Missing required parameters: action and gameId' 
      }, { status: 400 });
    }

    const seeder = new DataSeeder();

    if (action === 'seed') {
      const options = {
        gameId: String(gameId),
        numUsers: numUsers || 10,
        shouldCreateFullDraftboards: shouldCreateFullDraftboards || false
      };

      const result = await seeder.seedData(options);
      return json(result);
    } 
    else if (action === 'cleanup') {
      const result = await seeder.cleanupSeededData(String(gameId));
      return json(result);
    }
    else {
      return json({ 
        success: false, 
        message: 'Invalid action. Use "seed" or "cleanup"' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Seed API error:', error);
    return json({ 
      success: false, 
      message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

export async function GET() {
  // Safety check - only allow in development
  if (!dev) {
    return json({ 
      success: false, 
      message: 'Data seeding is only available in development mode' 
    }, { status: 403 });
  }

  return json({
    success: true,
    message: 'Seed API is available',
    usage: {
      'POST /api/dev-seed': {
        description: 'Seed or cleanup data',
        parameters: {
          action: '"seed" | "cleanup"',
          gameId: 'string (required)',
          numUsers: 'number (optional, default: 10)',
          shouldCreateFullDraftboards: 'boolean (optional, default: false)'
        }
      }
    }
  });
}
