import { CURRENT_STANDINGS } from "$env/static/private"

export async function getCurrentNhlStandings() {
  const response = await fetch(CURRENT_STANDINGS)
  const standingsRaw = await response.json()

  const standings = []

  for (let i = 31; i >= 0; i--) {
    // const draftPosition = i + 1
    const teamName = standingsRaw.standings[i].teamName.default
    const teamLogo = standingsRaw.standings[i].teamLogo
    const prospect = null
    const from =  undefined
    const points =  null

    standings.push({
      teamName,
      teamLogo,
      prospect,
      from,
      points,
      draftPosition: 0,
    })
  }

  standings.forEach((standing, idx) => {
    standing.draftPosition = idx + 1
  }) 


 return standings
}