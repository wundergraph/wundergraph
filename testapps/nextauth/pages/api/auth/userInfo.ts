import { getToken } from 'next-auth/jwt';

export default async (req, res) => {
	// If you don't have NEXTAUTH_SECRET set, you will have to pass your secret as `secret` to `getToken`
	const token = await getToken({ req });
	if (token) {
		res.status(200);
		res.json({ name: token.name, email: token.email, picture: token.picture });
	} else {
		// Not Signed in
		res.status(401);
	}
	res.end();
};
