<script lang="ts">
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';
  
  let gameData: any = null;
  let loading = true;
  let error = '';

  // Mock data structure - this would come from your actual API
  const mockStats = {
    totalUsers: 0,
    totalDrafts: 0,
    popularPositions: [] as Array<{position: string, count: number}>,
    topProspects: [] as Array<{name: string, selections: number}>,
    teamDistribution: [] as Array<{team: string, avgPick: number}>
  };

  onMount(async () => {
    try {
      // This would be your actual API call to get seeded data for visualization
      // For now, we'll simulate it
      const response = await fetch(`/api/game-stats?gameId=2`);
      
      if (response.ok) {
        gameData = await response.json();
        processDataForVisualization();
      } else {
        // Simulate data for demo purposes
        simulateData();
      }
    } catch (err) {
      console.log('Using simulated data for demo');
      simulateData();
    } finally {
      loading = false;
    }
  });

  function simulateData() {
    // Simulate what your seeded data might look like for visualization
    mockStats.totalUsers = 25;
    mockStats.totalDrafts = 800;
    mockStats.popularPositions = [
      { position: 'C', count: 320 },
      { position: 'LW', count: 180 },
      { position: 'RW', count: 150 },
      { position: 'D', count: 130 },
      { position: 'G', count: 20 }
    ];
    mockStats.topProspects = [
      { name: 'Connor Bedard', selections: 24 },
      { name: 'Leo Carlsson', selections: 15 },
      { name: 'Adam Fantilli', selections: 12 },
      { name: 'Matvei Michkov', selections: 8 },
      { name: 'Will Smith', selections: 7 }
    ];
    mockStats.teamDistribution = [
      { team: 'Chicago', avgPick: 1.2 },
      { team: 'Anaheim', avgPick: 2.1 },
      { team: 'Columbus', avgPick: 3.4 },
      { team: 'San Jose', avgPick: 4.8 },
      { team: 'Montreal', avgPick: 5.2 }
    ];
  }

  function processDataForVisualization() {
    // Process your actual seeded data here
    // This is where you'd analyze the real seeded data for charts
  }

  function getPositionColor(position: string): string {
    const colors: Record<string, string> = {
      'C': 'bg-blue-500',
      'LW': 'bg-green-500', 
      'RW': 'bg-yellow-500',
      'D': 'bg-purple-500',
      'G': 'bg-red-500'
    };
    return colors[position] || 'bg-gray-500';
  }
</script>

<div class="data-viz-demo bg-white border border-gray-200 rounded-lg p-6 mb-6">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-xl font-bold text-gray-800">📊 Draft Data Visualization</h3>
    {#if dev}
      <span class="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
        Demo with simulated data
      </span>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading draft data...</span>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Overview Stats -->
      <div class="space-y-4">
        <h4 class="font-semibold text-gray-700">Overview</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-600">{mockStats.totalUsers}</div>
            <div class="text-sm text-blue-700">Total Users</div>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600">{mockStats.totalDrafts}</div>
            <div class="text-sm text-green-700">Draft Selections</div>
          </div>
        </div>
      </div>

      <!-- Position Distribution Chart -->
      <div class="space-y-4">
        <h4 class="font-semibold text-gray-700">Position Distribution</h4>
        <div class="space-y-2">
          {#each mockStats.popularPositions as position}
            <div class="flex items-center">
              <div class="w-8 text-sm font-medium text-gray-600">{position.position}</div>
              <div class="flex-1 bg-gray-200 rounded-full h-4 mx-2">
                <div 
                  class="h-4 rounded-full {getPositionColor(position.position)}"
                  style="width: {(position.count / mockStats.totalDrafts) * 100}%"
                ></div>
              </div>
              <div class="w-12 text-sm text-gray-600 text-right">{position.count}</div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Top Prospects -->
      <div class="space-y-4">
        <h4 class="font-semibold text-gray-700">Most Selected Prospects</h4>
        <div class="space-y-2">
          {#each mockStats.topProspects as prospect, index}
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center">
                <div class="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                  {index + 1}
                </div>
                <span class="font-medium text-gray-800">{prospect.name}</span>
              </div>
              <span class="text-sm text-gray-600">{prospect.selections} picks</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Team Analysis -->
      <div class="space-y-4">
        <h4 class="font-semibold text-gray-700">Team Draft Patterns</h4>
        <div class="space-y-2">
          {#each mockStats.teamDistribution as team}
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="font-medium text-gray-800">{team.team}</span>
              <div class="text-right">
                <div class="text-sm font-semibold text-gray-700">Avg Pick: {team.avgPick}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    {#if dev && mockStats.totalUsers === 0}
      <div class="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
        <p class="text-blue-700">
          <strong>💡 Tip:</strong> Use the admin panel above to seed some data, then refresh this page to see real statistics and visualizations!
        </p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .data-viz-demo {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
</style>
