import * as cheerio from 'cheerio';
import { parseTeamAndTrade } from './parse-team-and-trade';
import type { DraftBoard } from '$lib/types';
import { getCurrentNhlStandings } from './get-current-nhl-standings';

export async function getDraftBoardOrder() {
  try {
    const response = await fetch('https://www.tankathon.com/nhl/draft_order')
    const tankathonPage = await response.text()
  
    const $ = cheerio.load(tankathonPage)
    const draftBoard: DraftBoard[] = []

    // TODO: figure out a way to determine if the draft order is out without manually setting this bool
    const draftOrderOut = true

    if(!draftOrderOut) {
      const currentStandings = await getCurrentNhlStandings()
      currentStandings.forEach(standing => {
        draftBoard.push(standing)
      })
    } else {
      $('table:first tr').each((i, tr) => {
        const $tr = $(tr)
        const position = Number($tr.find('td:first').text().trim())
        
        if (position > 0 && position < 33) {
          const teamCell = $tr.find('td:last')
          
          const mainTeamLink = teamCell.find('a').first()
          const mainTeam = mainTeamLink.find('.team-link-section > .desktop').text().trim()
          
          let fromTeam
          const tradeTeam = teamCell.find('.trade')
          if (tradeTeam) {
            fromTeam = tradeTeam.find('a > .desktop').text().trim()
          }
          
          const {team, teamLogo, from} = parseTeamAndTrade(mainTeam, fromTeam)
          
          draftBoard.push({
            draftPosition: position,
            teamName: team,
            teamLogo,
            prospect: null,
            from,
            points: null,
          })
        }
      })
    }
   
    return draftBoard
    
  } catch (error) {
    console.error('Error in tankathon scrape:', error);
  }
}