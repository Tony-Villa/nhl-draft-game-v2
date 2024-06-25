import { teamInfoLookup } from "./team-info-lookup"

export function parseTeamAndTrade(teamStr: string) {

  // let team = teamStr.match(/^.*?(?=\s\()/)
  let team: string = teamStr.includes('(') ? teamStr.substring(0, teamStr.indexOf(" (")) : teamStr
  let from: string | undefined
  
  if(teamStr.includes('(')){
    from = teamStr.replace(/^[^(]*\(/, "").replace(/\)[^(]*$/, "").toLocaleLowerCase().replace('from ', '')
    if(from.includes('islanders')){
      from = 'islanders'
    } else {
      from = from.split(' ')?.[0]
    }
  }

  const {defaultName, logo} = teamInfoLookup(team) 
  let fromLogo
  if(from){
    const {logo: fromL} = teamInfoLookup(from)
    fromLogo = fromL
  }

  return {team: defaultName, teamLogo: logo ,from: fromLogo }
}