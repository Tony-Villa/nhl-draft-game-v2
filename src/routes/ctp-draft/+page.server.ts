import { redis } from '$lib/server/redis';
import type { PageServerLoad } from './$types';
import { CURRENT_STANDINGS } from '$env/static/private';
import { currentPlayers, pointsDraft } from '$lib/data/draft';

const MAX_AGE = 1800;

export const load: PageServerLoad = async ({ setHeaders }) => {
	const cached = await redis.get('standings');
	let standings;
	// check redis
	if (cached) {
		const ttl = await redis.ttl(MAX_AGE.toString());
		setHeaders({ 'cache-control': `max-age=${ttl}` });

		standings = JSON.parse(cached);
	} else {
		// get current standings
		const res = await fetch(CURRENT_STANDINGS);
		const fetchedStandings = await res.json();
		standings = fetchedStandings?.standings;

		redis.set('standings', JSON.stringify(standings), 'EX', MAX_AGE);
	}

	// standings = standings.map((x) => x.teamRecords).flat();

	const pointsDraftData = getDraftStandings(standings, pointsDraft, 'points');

	return { pointsDraftData };
};

type DraftStanding = DraftStats[];

interface DraftStats {
	playerName: string;
	total: number;
	gameState: string;
	teamStats: TeamStats[];
}

interface TeamStats {
	teamName: string;
	points: number;
	logo: string;
	record?: LeagueRecord;
	gamesPlayed?: number;
	gamesRemaining?: number;
}

interface LeagueRecord {
	wins: number;
	losses: number;
	ot: number;
	// type: string;
}

interface winningState {
	total: number;
	index: number[];
	topPlayers: string[];
}

const getDraftStandings = (standings: any, draftPicks: any, competitionType: string = 'pointsDraft') => {
	const draftStandings: DraftStanding = [];

	for (let i = 0; i < currentPlayers.length; i++) {
		const currentPlayerStats: DraftStats = {
			playerName: currentPlayers[i],
			total: 0,
			gameState: 'losing',
			teamStats: []
		};

		for (let j = 0; j < standings.length; j++) {
			const teamName = standings[j].teamName.default;
			if (draftPicks[teamName] && draftPicks[teamName] === currentPlayerStats.playerName) {
				currentPlayerStats.total += standings[j].points;
				currentPlayerStats.teamStats.push({
					teamName,
					points: standings[j].points,
					logo: standings[j].teamLogo,
					record: {
						wins: standings[j].wins,
						losses: standings[j].losses,
						ot: standings[j].otLosses
						// type: 'string'
					},
					gamesPlayed: standings[j].gamesPlayed,
					gamesRemaining: 82 - standings[j].gamesPlayed
				});
			}
		}
		draftStandings.push(currentPlayerStats);
	}

	const winningPlayer: winningState = {
		total: 0,
		index: [],
		topPlayers: []
	};

	if (competitionType === 'points') {
		for (let i = 0; i < draftStandings.length; i++) {
			if (draftStandings[i].total === winningPlayer.total) {
				winningPlayer.index = [...winningPlayer.index, i];
				winningPlayer.topPlayers.push(draftStandings[i].playerName);
			}
			if (draftStandings[i].total > winningPlayer.total) {
				winningPlayer.total = draftStandings[i].total;
				winningPlayer.index = [i];
				winningPlayer.topPlayers = [draftStandings[i].playerName];
			}
		}
	} else {
		for (let i = 0; i < draftStandings.length; i++) {
			if (winningPlayer.total === 0) {
				winningPlayer.total = 9999;
			}
			if (draftStandings[i].total === winningPlayer.total) {
				winningPlayer.index = [...winningPlayer.index, i];
				winningPlayer.topPlayers.push(draftStandings[i].playerName);
			}
			if (draftStandings[i].total < winningPlayer.total) {
				winningPlayer.total = draftStandings[i].total;
				winningPlayer.index = [i];
				winningPlayer.topPlayers = [draftStandings[i].playerName];
			}
		}
	}

	if (winningPlayer.index.length === 1) {
		draftStandings[winningPlayer.index[0]].gameState = 'winning';
	} else {
		winningPlayer.index.forEach((x) => {
			draftStandings[x].gameState = 'tie';
		});
	}

	return draftStandings;
};
