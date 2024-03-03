import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, type UserSchema } from './db/schema/users';

export const checkIfEmailExists = async (email: string) => {
	const [existingUser] = await db.select({
		id: users.id,
		email: users.email,
		password: users.password,
		keys: users.keys,
	}).from(users).where(eq(users.email, email));

	return existingUser;
};

export const insertNewUser = async (user: UserSchema) => {
	return await db.insert(users).values(user);
};
