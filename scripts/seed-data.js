#!/usr/bin/env node

/**
 * Standalone script to seed the NHL Draft Game database
 * 
 * Usage:
 *   node scripts/seed-data.js --game-id=2 --users=20 --with-drafts
 *   node scripts/seed-data.js --game-id=2 --cleanup
 */

import { DataSeeder } from '../src/lib/server/seeders/data-seeder.js';
import process from 'process';

// Simple argument parser
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    gameId: null,
    numUsers: 10,
    shouldCreateFullDraftboards: false,
    cleanup: false,
    help: false
  };

  for (const arg of args) {
    if (arg.startsWith('--game-id=')) {
      options.gameId = arg.split('=')[1];
    } else if (arg.startsWith('--users=')) {
      options.numUsers = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--with-drafts') {
      options.shouldCreateFullDraftboards = true;
    } else if (arg === '--cleanup') {
      options.cleanup = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
NHL Draft Game Data Seeder

Usage:
  node scripts/seed-data.js [options]

Options:
  --game-id=<id>     Game ID to seed data for (required)
  --users=<number>   Number of fake users to create (default: 10)
  --with-drafts      Create full draftboards for users
  --cleanup          Remove all seeded data for the game
  --help, -h         Show this help message

Examples:
  # Create 20 users with full draftboards for game 2
  node scripts/seed-data.js --game-id=2 --users=20 --with-drafts

  # Create 10 users without draftboards for game 2
  node scripts/seed-data.js --game-id=2

  # Clean up all seeded data for game 2
  node scripts/seed-data.js --game-id=2 --cleanup

Safety:
  This script checks for development environment indicators to prevent
  accidental seeding of production data.
`);
}

function checkEnvironmentSafety() {
  // Read environment variables directly since we can't import SvelteKit env in standalone script
  const dbUrl = process.env.VITE_TURSO_DB_URL || process.env.DATABASE_URL || '';
  
  const isDev = process.env.NODE_ENV === 'development' || 
                process.env.NODE_ENV === 'dev' ||
                dbUrl.includes('localhost') ||
                dbUrl.includes('127.0.0.1') ||
                dbUrl.includes('.local') ||
                dbUrl.includes('dev') ||
                dbUrl.includes('test') ||
                dbUrl.includes('local.db');

  if (!isDev) {
    console.error('🚨 SAFETY CHECK FAILED 🚨');
    console.error('This script appears to be running against a production database.');
    console.error('Database URL:', dbUrl);
    console.error('Environment:', process.env.NODE_ENV);
    console.error('');
    console.error('If you\'re sure this is a development environment, set NODE_ENV=development');
    process.exit(1);
  }

  console.log('✅ Environment safety check passed - proceeding with development database');
  console.log('Database URL:', dbUrl);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  if (!options.gameId) {
    console.error('Error: --game-id is required');
    showHelp();
    process.exit(1);
  }

  // Safety check
  checkEnvironmentSafety();

  const seeder = new DataSeeder();

  try {
    if (options.cleanup) {
      console.log(`🧹 Cleaning up seeded data for game ${options.gameId}...`);
      const result = await seeder.cleanupSeededData(options.gameId);
      
      if (result.success) {
        console.log('✅', result.message);
      } else {
        console.error('❌', result.message);
        process.exit(1);
      }
    } else {
      console.log(`🌱 Seeding data for game ${options.gameId}...`);
      console.log(`   Users to create: ${options.numUsers}`);
      console.log(`   Create draftboards: ${options.shouldCreateFullDraftboards ? 'Yes' : 'No'}`);
      
      const result = await seeder.seedData({
        gameId: options.gameId,
        numUsers: options.numUsers,
        shouldCreateFullDraftboards: options.shouldCreateFullDraftboards
      });

      if (result.success) {
        console.log('✅', result.message);
        if (result.userIds) {
          console.log(`📋 Created user IDs: ${result.userIds.slice(0, 5).join(', ')}${result.userIds.length > 5 ? '...' : ''}`);
        }
      } else {
        console.error('❌', result.message);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
