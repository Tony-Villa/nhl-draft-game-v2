# Data Seeding Guide

This guide explains how to seed your NHL Draft Game database with fake users and draftboards for testing and data visualization purposes.

## 🚨 Safety Features

All seeding methods include multiple safety checks to prevent accidental seeding of production databases:

- **Development-only**: Seeding only works in development mode
- **Environment checks**: Scripts verify database URLs contain development indicators
- **Test email domains**: Seeded users use identifiable test email domains
- **Explicit confirmation**: Cleanup operations require confirmation

## 🖥️ Admin UI (Recommended for Development)

When running in development mode, an admin panel appears at the top of your homepage with easy-to-use controls.

### Features:
- **Game ID selection**: Choose which game to seed
- **User count**: Specify how many fake users to create (1-100)
- **Draftboard option**: Toggle whether to create complete draftboards
- **One-click cleanup**: Remove all seeded data
- **Live terminal command**: Shows equivalent command-line usage

### Usage:
1. Start your dev server: `pnpm dev`
2. Navigate to your homepage
3. Use the orange "Development Admin Panel" at the top
4. Configure your settings and click "🌱 Seed Data"

## 📟 Command Line Interface

For more control or automation, use the standalone script:

### Basic Usage:
```bash
# Seed 10 users without draftboards for game 2
pnpm seed -- --game-id=2

# Seed 25 users with complete draftboards for game 2
pnpm seed -- --game-id=2 --users=25 --with-drafts

# Clean up all seeded data for game 2
pnpm seed -- --game-id=2 --cleanup

# Show help
pnpm seed:help
```

### Direct Node Usage:
```bash
# Same commands work with direct node calls
node scripts/seed-data.js --game-id=2 --users=20 --with-drafts
node scripts/seed-data.js --game-id=2 --cleanup
```

## 🎭 What Gets Created

### Fake Users:
- **Realistic names**: Generated from pools of first/last names
- **Test emails**: Uses `@draftgame.com`, `@testuser.dev`, `@seeduser.test`
- **Unique avatars**: Generated using DiceBear API
- **Trackable**: Easily identifiable for cleanup

### Draftboards (Optional):
- **32 draft picks**: One for each NHL team
- **Smart prospect selection**: Uses tiered selection based on prospect rankings
- **Realistic strategy**: Mimics human draft behavior
- **Points ready**: Prepared for scoring when actual draft occurs

## 🗂️ Data Structure

### Prospect Tiers:
- **Tier 1**: Rank 1 (consensus #1 pick)
- **Tier 2**: Ranks 2-4 (elite prospects)
- **Tier 3**: Ranks 5-12 (first round locks)
- **Tier 4**: Ranks 13-19 (late first round)
- **Tier 5**: Ranks 20+ (wild cards)

### Draft Strategy:
Each fake user's draftboard uses intelligent prospect selection that:
- Prioritizes higher-ranked prospects early
- Introduces realistic randomness
- Ensures no duplicate selections
- Matches NHL team draft order

## 🧹 Cleanup

The cleanup feature safely removes:
- All users with test email domains
- Their draft entries for the specified game
- Associated data and relationships

**Note**: Regular users with real email domains are never affected.

## 🔧 Technical Details

### Files Created:
- `src/lib/server/seeders/data-seeder.ts` - Main seeding logic
- `src/routes/api/dev-seed/+server.ts` - API endpoint for UI
- `scripts/seed-data.js` - Standalone CLI script
- `src/lib/components/DevAdminPanel.svelte` - Admin UI component

### Database Tables Affected:
- `users` - Fake user accounts
- `drafts` - User draft selections
- `prospects` - Read-only (for selection)
- `games` - Read-only (for validation)

### Dependencies:
- Uses existing Drizzle ORM setup
- Leverages Better Auth for ID generation
- Integrates with your type definitions

## 🎯 Use Cases

### Data Visualization:
- Create realistic datasets for charts and graphs
- Test leaderboards and scoring systems
- Validate UI with multiple user scenarios

### Load Testing:
- Test database performance with many users
- Validate API endpoints under load
- Check UI behavior with large datasets

### Feature Development:
- Test user interactions without manual account creation
- Validate draft logic with diverse selections
- Debug scoring algorithms with known data

## 🚀 Quick Start

1. **Ensure you're in development mode**
2. **Start your dev server**: `pnpm dev`
3. **Visit your homepage** - the admin panel should appear
4. **Configure settings** and click "🌱 Seed Data"
5. **Check your database** to verify the data was created
6. **Clean up when done** using the "🧹 Cleanup" button

## ⚠️ Troubleshooting

### "Seeding only available in development mode"
- Check that `NODE_ENV` is set to `development`
- Verify you're using a local/development database URL
- Restart your dev server

### "No prospects found in database"
- Make sure you have prospect data in your database
- Run your prospect seeding/import scripts first
- Check that the `prospects` table has data

### "Game with ID X not found"
- Verify the game exists in your `games` table
- Check that you're using the correct game ID
- Ensure the game hasn't been deleted

### Database connection errors
- Verify your environment variables are set correctly
- Check that your database is running (for local SQLite)
- Confirm Turso credentials for cloud databases

## 📈 Next Steps

After seeding data, you can:
- **Visualize**: Create charts and graphs with the seeded data
- **Test**: Validate your application's behavior with multiple users
- **Develop**: Build new features using realistic test data
- **Score**: Run scoring algorithms once the real draft occurs

Remember to clean up seeded data before deploying to production!
