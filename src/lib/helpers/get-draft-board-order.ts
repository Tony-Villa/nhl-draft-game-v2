import * as cheerio from 'cheerio';
import { parseTeamAndTrade } from './parse-team-and-trade';
import type { DraftBoard } from '$lib/types';
import { getCurrentNhlStandings } from './get-current-nhl-standings';


export async function getDraftBoardOrder() {
  try {

    const response = await fetch('https://en.wikipedia.org/wiki/2025_NHL_entry_draft')
    const fullNhlDraftPage = await response.text()
  
    const $ = cheerio.load(fullNhlDraftPage)
    const $roundOneTableCells = $('h3#Round_one').parent().nextAll('.wikitable:first') || undefined
  
    const draftBoard: DraftBoard[] = []

    // TODO: figure out a way to determine if the draft order is out without manually setting this bool
    const draftOrderOut= false

    if(!draftOrderOut) {
      const currentStandings = await getCurrentNhlStandings()

      currentStandings.forEach(standing => {
        draftBoard.push(standing)
      })

    } else {

      $roundOneTableCells.each((i, tbody) => {
        const $tr = $(tbody).find('tr');
  
        $tr.each((j, tr) => {
          const position = Number($(tr).find('th').text().trim())
  
          if(position > 0 && position < 33) {
            const teamRaw = $(tr).children().eq(3).text().trim()
            const {team, from, teamLogo} = parseTeamAndTrade(teamRaw)
  
            draftBoard.push({
              draftPosition: position,
              teamName: team,
              teamLogo,
              prospect: null,
              from: position === 25 ? undefined : from || undefined,
              points: null,
            })
          }
        })
     })

    }
   
   return draftBoard
    
  } catch (error) {
    console.error('ERROR in wikipedia scrape: ', error);
  }

  
}