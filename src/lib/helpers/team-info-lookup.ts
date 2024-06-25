import { nhlTeams } from "$lib/static/teams-info";

export function teamInfoLookup(teamName: string) {
  let logo;
  let defaultName;

  nhlTeams.forEach(team => {
    if(team.teamName.default.toLowerCase().includes(teamName.toLowerCase())){
      logo = team.teamLogo,
      defaultName = team.teamName.default
    }
  })

  return {logo, defaultName}
}