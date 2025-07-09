import { teamInfoLookup } from "./team-info-lookup"

export function parseTeamAndTrade(mainTeam: string, fromTeam?: string) {
  // Replace NY with New York
  mainTeam = mainTeam.replace('NY ', 'New York ')
  
  // Special case for Utah
  if (mainTeam.toLowerCase().includes('utah')) {
    mainTeam = 'Utah Hockey Club'
  }

  const {defaultName, logo} = teamInfoLookup(mainTeam)
  let fromLogo

  if (fromTeam) {
    // Clean up the from team name
    const {logo: fromL} = teamInfoLookup(fromTeam, 'trade')
    fromLogo = fromL
  }

  return {
    team: defaultName,
    teamLogo: logo,
    from: fromLogo
  }
}