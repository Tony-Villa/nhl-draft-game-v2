import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, type UserSchema } from './db/schema/users';

export const checkIfEmailExists = async (email: string) => {
	const user = await db.select().from(users).where(eq(users.email, email));

	return user.length > 0;
};

export const insertNewUser = async (user: UserSchema) => {
	return await db.insert(users).values(user);
};
