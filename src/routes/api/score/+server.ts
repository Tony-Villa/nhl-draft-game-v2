import { computePoints } from '$lib/helpers/compute-points'
import { db } from '$lib/server/db/index.js'
import { drafts, nhlDraft, users, scores } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {

    const officialDraft = await db.select().from(nhlDraft).where(eq(nhlDraft.gameId, 1))

    // const userList = await db.select({
    //   id: users.id,
    //   name: users.name,
    //   avatar: users.avatarUrl
    // }).from(users)
  

    // const draftList = await Promise.all(userList.map(async user => {
    //   let draft = await db.select().from(drafts).where(eq(drafts.userId, user.id)) 

    //   draft.forEach(x => {
    //     if(x.prospect){
    //       x.prospect = JSON.parse(x.prospect as string)
    //     }
    //   })

    //   return draft
    // }))

    // const scoreList = draftList.map(d => {

    //   if(d.length > 0){
    //     const {userId, score} = computePoints(d, officialDraft)
  
    //     return {
    //       userId,
    //       score
    //     }
    //   } else {
    //     console.log('score list issue, maybe no draft? ', d);
    //   }
    // })

    // console.log(scoreList);

    // await Promise.all(scoreList.map(async user => {
    //   if(user?.userId) {
    //     await db.update(scores).set({score: user.score}).where(eq(scores.userId, user?.userId))
    //   }
    // }))


		return new Response(JSON.stringify({dope: 'yeah'}), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}