import type { Prospect } from '$lib/types';
import { getContext, setContext } from 'svelte';

class Prospects {
	prospects: Prospect[] = $state([]);

	constructor(initialProspects: Prospect[]) {
		this.prospects = initialProspects;
	}

	draftProspect(prospect: Prospect) {
		for (const p of this.prospects) {
			if (p.name === prospect.name) {
				p.drafted = true;
			}
		}
	}

	undraftProspect(prospect: Prospect) {
		for (const p of this.prospects) {
			if (p.name === prospect.name) {
				p.drafted = false;
			}
		}
	}
}

const PROSPECT_CTX = 'PROSPECT_CTX';

export function setProspects(prospects: Prospect[]) {
	const prospectsState = new Prospects(prospects);
	setContext(PROSPECT_CTX, prospectsState);
	return prospectsState;
}

export function getProspects() {
	return getContext<Prospects>(PROSPECT_CTX);
}
