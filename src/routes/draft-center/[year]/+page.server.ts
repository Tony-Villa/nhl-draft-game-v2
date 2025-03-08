export const load = async ({fetch, params}) => {

  const ladderRes = await fetch(`../api/ladder?year=${params.year}`)
  const ladder = await ladderRes.json()

  // console.log('Ladder:', ladder)

  return {ladder}
};