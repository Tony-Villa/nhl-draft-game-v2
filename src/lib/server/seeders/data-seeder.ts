import { db } from '../db/index.js';
import { users, drafts, prospects, games } from '../db/schema/index.js';
import { generateId } from 'better-auth';
import { eq, and, like, or } from 'drizzle-orm';
import type { DraftBoard, Prospect } from '$lib/types.js';

// NHL teams for realistic draft assignments
const NHL_TEAMS = [
  { name: 'Anaheim Ducks', abbrev: 'ANA' },
  { name: 'Boston Bruins', abbrev: 'BOS' },
  { name: 'Buffalo Sabres', abbrev: 'BUF' },
  { name: 'Calgary Flames', abbrev: 'CGY' },
  { name: 'Carolina Hurricanes', abbrev: 'CAR' },
  { name: 'Chicago Blackhawks', abbrev: 'CHI' },
  { name: 'Colorado Avalanche', abbrev: 'COL' },
  { name: 'Columbus Blue Jackets', abbrev: 'CBJ' },
  { name: 'Dallas Stars', abbrev: 'DAL' },
  { name: 'Detroit Red Wings', abbrev: 'DET' },
  { name: 'Edmonton Oilers', abbrev: 'EDM' },
  { name: 'Florida Panthers', abbrev: 'FLA' },
  { name: 'Los Angeles Kings', abbrev: 'LAK' },
  { name: 'Minnesota Wild', abbrev: 'MIN' },
  { name: 'Montreal Canadiens', abbrev: 'MTL' },
  { name: 'Nashville Predators', abbrev: 'NSH' },
  { name: 'New Jersey Devils', abbrev: 'NJD' },
  { name: 'New York Islanders', abbrev: 'NYI' },
  { name: 'New York Rangers', abbrev: 'NYR' },
  { name: 'Ottawa Senators', abbrev: 'OTT' },
  { name: 'Philadelphia Flyers', abbrev: 'PHI' },
  { name: 'Pittsburgh Penguins', abbrev: 'PIT' },
  { name: 'San Jose Sharks', abbrev: 'SJS' },
  { name: 'Seattle Kraken', abbrev: 'SEA' },
  { name: 'St. Louis Blues', abbrev: 'STL' },
  { name: 'Tampa Bay Lightning', abbrev: 'TBL' },
  { name: 'Toronto Maple Leafs', abbrev: 'TOR' },
  { name: 'Utah Hockey Club', abbrev: 'UHC' },
  { name: 'Vancouver Canucks', abbrev: 'VAN' },
  { name: 'Vegas Golden Knights', abbrev: 'VGK' },
  { name: 'Washington Capitals', abbrev: 'WSH' },
  { name: 'Winnipeg Jets', abbrev: 'WPG' }
];

// Generate fake user names
const FIRST_NAMES = [
  'Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper', 'Jamie', 'Kelly',
  'Logan', 'Morgan', 'Nico', 'Oakley', 'Parker', 'Quinn', 'Reese', 'Sage', 'Taylor', 'Uri',
  'Val', 'Wren', 'Zara', 'Avery', 'Brook', 'Cameron', 'Dakota', 'Ellis', 'Frankie', 'Gus',
  'Hayden', 'Indigo', 'Jude', 'Kai', 'Lane', 'Max', 'Nova', 'Owen', 'Phoenix', 'River'
];

const LAST_NAMES = [
  'Anderson', 'Brooks', 'Chen', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris', 'Johnson', 'King',
  'Lee', 'Miller', 'Nelson', 'O\'Connor', 'Parker', 'Quinn', 'Rodriguez', 'Smith', 'Taylor', 'Wilson',
  'Brown', 'Jones', 'Williams', 'Martinez', 'Lopez', 'Gonzalez', 'Thompson', 'White', 'Jackson', 'Clark'
];

interface SeedOptions {
  gameId: string;
  numUsers: number;
  shouldCreateFullDraftboards?: boolean;
}

export class DataSeeder {
  private generateUsername(): string {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `${firstName}${lastName}${randomNum}`;
  }

  private generateEmail(username: string): string {
    const domains = ['draftgame.com', 'testuser.dev', 'seeduser.test'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username.toLowerCase()}@${domain}`;
  }

  private async createFakeUsers(count: number): Promise<string[]> {
    const userIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const userId = generateId(15);
      const username = this.generateUsername();
      const email = this.generateEmail(username);
      
      try {
        await db.insert(users).values({
          id: userId,
          name: username,
          email: email,
          password: 'fake-password-hash', // In real app, this would be hashed
          keys: [], // Empty keys array for fake users
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        });
        
        userIds.push(userId);
        console.log(`Created user: ${username} (${email})`);
      } catch (error) {
        console.error(`Failed to create user ${username}:`, error);
      }
    }
    
    return userIds;
  }

  private async getProspects(): Promise<Prospect[]> {
    const prospectData = await db.select()
      .from(prospects)
      .where(eq(prospects.draftYear, 2025))
      .limit(100);
    
    console.log(`Found ${prospectData.length} prospects for 2025 draft year`);
    
    if (prospectData.length === 0) {
      throw new Error('No prospects found for 2025 draft year. Please ensure 2025 prospects are seeded in the database.');
    }
    
    return prospectData.map(p => ({
      id: p.id,
      rank: p.rank,
      name: p.name || 'Unknown Player',
      position: p.position || undefined,
      nation: p.nation || undefined,
      team: p.team,
      league: p.league,
      birthDay: p.birthDay,
      height: p.height.toString(),
      weight: p.weight.toString(),
      shoots: p.shoots
    }));
  }

  private createDraftStrategy(prospects: Prospect[]): Prospect[][] {
    // Sort prospects by rank for tiered selection
    const sortedProspects = [...prospects].sort((a, b) => parseInt(a.rank) - parseInt(b.rank));
    
    const tiers: Prospect[][] = [
      [], // Tier 1: Rank 1
      [], // Tier 2: Ranks 2-4
      [], // Tier 3: Ranks 5-12
      [], // Tier 4: Ranks 13-19
      []  // Tier 5: Ranks 20+
    ];

    sortedProspects.forEach(prospect => {
      const rank = parseInt(prospect.rank);
      if (rank === 1) {
        tiers[0].push(prospect);
      } else if (rank >= 2 && rank <= 4) {
        tiers[1].push(prospect);
      } else if (rank >= 5 && rank <= 12) {
        tiers[2].push(prospect);
      } else if (rank >= 13 && rank <= 19) {
        tiers[3].push(prospect);
      } else {
        tiers[4].push(prospect);
      }
    });

    return tiers;
  }

  private generateDraftboard(prospects: Prospect[]): DraftBoard[] {
    const draftboard: DraftBoard[] = [];
    const tiersCopy = this.createDraftStrategy(prospects);
    
    // Create 32 draft picks (one per NHL team)
    for (let i = 1; i <= 32; i++) {
      const team = NHL_TEAMS[i - 1];
      let selectedProspect: Prospect | null = null;

      // Try to select from available tiers (with some randomness)
      for (let tierIndex = 0; tierIndex < tiersCopy.length; tierIndex++) {
        if (tiersCopy[tierIndex].length > 0) {
          const randomIndex = Math.floor(Math.random() * tiersCopy[tierIndex].length);
          selectedProspect = tiersCopy[tierIndex].splice(randomIndex, 1)[0];
          break;
        }
      }

      draftboard.push({
        draftPosition: i,
        teamName: team.name,
        teamLogo: undefined, // You might want to add team logos later
        prospect: selectedProspect,
        points: null
      });
    }

    return draftboard;
  }

  private async saveDraftboard(userId: string, gameId: string, draftboard: DraftBoard[]): Promise<void> {
    for (const pick of draftboard) {
      if (!pick.prospect) continue;

      try {
        await db.insert(drafts).values({
          userId,
          gameId,
          positionDrafted: pick.draftPosition,
          team: pick.teamName || `Team ${pick.draftPosition}`,
          prospectId: pick.prospect.id,
          points: null
        }).onConflictDoUpdate({
          target: [drafts.userId, drafts.positionDrafted, drafts.gameId],
          set: { 
            prospectId: pick.prospect.id,
            team: pick.teamName || `Team ${pick.draftPosition}`
          }
        });
      } catch (error) {
        console.error(`Failed to save draft pick ${pick.draftPosition} for user ${userId}:`, error);
      }
    }
  }

  async seedData(options: SeedOptions): Promise<{ success: boolean; message: string; userIds?: string[] }> {
    try {
      console.log(`Starting seed process for game ${options.gameId}...`);
      
      // Verify game exists
      const game = await db.select().from(games).where(eq(games.id, options.gameId)).get();
      if (!game) {
        return { success: false, message: `Game with ID ${options.gameId} not found` };
      }

      // Create fake users
      console.log(`Creating ${options.numUsers} fake users...`);
      const userIds = await this.createFakeUsers(options.numUsers);
      
      if (userIds.length === 0) {
        return { success: false, message: 'Failed to create any users' };
      }

      // If we should create full draftboards
      if (options.shouldCreateFullDraftboards) {
        console.log('Fetching prospects for draftboards...');
        const prospects = await this.getProspects();
        
        if (prospects.length === 0) {
          return { 
            success: false, 
            message: 'No prospects found in database. Please seed prospects first.' 
          };
        }

        console.log(`Creating draftboards for ${userIds.length} users...`);
        for (const userId of userIds) {
          const draftboard = this.generateDraftboard(prospects);
          await this.saveDraftboard(userId, options.gameId, draftboard);
          console.log(`Created draftboard for user ${userId}`);
        }
      }

      const message = options.shouldCreateFullDraftboards 
        ? `Successfully created ${userIds.length} users with complete draftboards for game ${options.gameId}`
        : `Successfully created ${userIds.length} users for game ${options.gameId} (no draftboards created)`;

      return { 
        success: true, 
        message,
        userIds 
      };
    } catch (error) {
      console.error('Seeding failed:', error);
      return { 
        success: false, 
        message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async cleanupSeededData(gameId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Cleaning up seeded data for game ${gameId}...`);
      
      // Get all users who have email domains that indicate they're test users
      const testUsers = await db.select()
        .from(users)
        .where(
          or(
            like(users.email, '%@draftgame.com'),
            like(users.email, '%@testuser.dev'),
            like(users.email, '%@seeduser.test')
          )
        );

      // Delete drafts for these users in the specified game
      for (const user of testUsers) {
        await db.delete(drafts).where(
          and(
            eq(drafts.userId, user.id),
            eq(drafts.gameId, gameId)
          )
        );
      }

      // Delete the test users themselves
      for (const user of testUsers) {
        await db.delete(users).where(eq(users.id, user.id));
      }

      return {
        success: true,
        message: `Successfully cleaned up ${testUsers.length} seeded users and their drafts`
      };
    } catch (error) {
      console.error('Cleanup failed:', error);
      return {
        success: false,
        message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
