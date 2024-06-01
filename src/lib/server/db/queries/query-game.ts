import { sql } from "drizzle-orm";
import { db } from "..";
import { drafts, games, scores, users } from "../schema";

export function queryGame() {

  const query = sql`SELECT
  game.id,
  game.start_date,
  game.end_date,
  game.lock_date,
  game.year,
  JSON_GROUP_ARRAY(
    JSON_OBJECT(
      'userId',
      user.id,
      'userName',
      user.name,
      'score',
      score.score,
      'draft',
      (
        SELECT
          JSON_GROUP_ARRAY(
            JSON_OBJECT(
              'draftPosition',
              drafts.position_drafted,
              'prospect',
              drafts.prospect,
              'team',
              drafts.team
            )
          )
        FROM
          ${drafts}
        WHERE
          ${drafts.gameId} = ${games.id}
          AND ${drafts.userId} = ${users.id}
      )
    )
  ) AS players
FROM
  ${games}
  LEFT JOIN ${scores} ON ${scores.gameId} = ${games.id}
  LEFT JOIN ${users} ON ${scores.userId} = ${users.id}`;

  const res: unknown = db.get(query)

  return res
}