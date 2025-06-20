<script lang="ts">
  import { dev } from '$app/environment';
  import { toast } from 'svelte-french-toast';

  let isSeeding = false;
  let gameId = '2';
  let numUsers = 10;
  let shouldCreateFullDraftboards = false;

  async function seedData() {
    if (!dev) {
      toast.error('Seeding is only available in development mode');
      return;
    }

    isSeeding = true;
    
    try {
      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'seed',
          gameId,
          numUsers,
          shouldCreateFullDraftboards
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to seed data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      isSeeding = false;
    }
  }

  async function cleanupData() {
    if (!dev) {
      toast.error('Cleanup is only available in development mode');
      return;
    }

    if (!confirm('Are you sure you want to remove all seeded data? This cannot be undone.')) {
      return;
    }

    isSeeding = true;
    
    try {
      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cleanup',
          gameId
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to cleanup data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      isSeeding = false;
    }
  }
</script>

{#if dev}
  <div class="dev-admin-panel bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
    <div class="flex items-center gap-2 mb-4">
      <div class="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
      <h3 class="text-lg font-semibold text-orange-800">🚧 Development Admin Panel</h3>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Seeding Controls -->
      <div class="space-y-4">
        <h4 class="font-medium text-gray-800">Data Seeding</h4>
        
        <div class="space-y-3">
          <div>
            <label for="gameId" class="block text-sm font-medium text-gray-700 mb-1">
              Game ID
            </label>
            <input
              id="gameId"
              type="text"
              bind:value={gameId}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2"
            />
          </div>
          
          <div>
            <label for="numUsers" class="block text-sm font-medium text-gray-700 mb-1">
              Number of Users
            </label>
            <input
              id="numUsers"
              type="number"
              bind:value={numUsers}
              min="1"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
            />
          </div>
          
          <div class="flex items-center">
            <input
              id="createDraftboards"
              type="checkbox"
              bind:checked={shouldCreateFullDraftboards}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="createDraftboards" class="ml-2 text-sm text-gray-700">
              Create full draftboards (takes longer)
            </label>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button
            onclick={seedData}
            disabled={isSeeding || !gameId}
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if isSeeding}
              <span class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Seeding...
              </span>
            {:else}
              🌱 Seed Data
            {/if}
          </button>
          
          <button
            onclick={cleanupData}
            disabled={isSeeding || !gameId}
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🧹 Cleanup
          </button>
        </div>
      </div>
      
      <!-- Information -->
      <div class="space-y-4">
        <h4 class="font-medium text-gray-800">Information</h4>
        
        <div class="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Seed Data:</strong> Creates fake users and optionally their draftboards for the specified game.
          </p>
          <p>
            <strong>Cleanup:</strong> Removes all fake users and their data (identifiable by test email domains).
          </p>
          <p class="text-orange-600">
            <strong>⚠️ Dev Only:</strong> This panel only works in development mode and won't appear in production.
          </p>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h5 class="font-medium text-blue-800 mb-2">Terminal Alternative</h5>
          <code class="text-xs text-blue-700 block whitespace-pre-wrap">
node scripts/seed-data.js --game-id={gameId} --users={numUsers}{shouldCreateFullDraftboards ? ' --with-drafts' : ''}
          </code>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .dev-admin-panel {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
</style>
