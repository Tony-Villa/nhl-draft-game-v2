import * as cheerio from 'cheerio';
import { parseTeamAndTrade } from './parse-team-and-trade';
import type { DraftBoard } from '$lib/types';


// function JSDOM(html: any) { return parseHTML(html); }

export async function getDraftBoardOrder() {
  const response = await fetch('https://en.wikipedia.org/wiki/2024_NHL_entry_draft')
  const fullNhlDraftPage = await response.text()

  const $ = cheerio.load(fullNhlDraftPage)
  const $roundOneTableCells = $('h3 span#Round_one').parent().next()

  const draftBoard: DraftBoard[] = []

  $roundOneTableCells.each((i, tbody) => {
    const $tr = $(tbody).find('tr');
    $tr.each((j, tr) => {
      const position = Number($(tr).find('th').text().trim())
        if(position > 0 && position < 33) {
        const teamRaw = $(tr).find('td').text().trim()
        // console.log(team);
        const {team, from, teamLogo} = parseTeamAndTrade(teamRaw)

        draftBoard.push({
          draftPosition: position,
          teamName: team,
          teamLogo,
          prospect: null,
          from: position === 25 ? undefined : from || undefined
        })
      }
    })
 })

  
 return draftBoard
}