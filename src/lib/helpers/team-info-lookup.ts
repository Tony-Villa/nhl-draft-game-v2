import { nhlTeams } from "$lib/static/teams-info";

export function teamInfoLookup(teamName: string, type: 'draft' | 'trade' = 'draft') {
  let logo;
  let defaultName;

  if(teamName && type === 'trade') {
    logo = nhlTeams.find(team => team.teamAbbrev.default.toLowerCase().includes(teamName.toLowerCase()))?.teamLogo
    return {logo}
  }

  nhlTeams.forEach(team => {
    if(team.teamName.default.toLowerCase().includes(teamName.toLowerCase())){
      logo = team.teamLogo,
      defaultName = team.teamName.default
    }
  })

  return {logo, defaultName}
}