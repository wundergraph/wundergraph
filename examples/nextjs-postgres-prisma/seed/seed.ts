import {Client} from "../.wundergraph/generated/wundergraph.client";
import fetch from 'node-fetch'

const seed = async () => {
	const client = new Client({
		customFetch: (input, init) => fetch(input,init)
	});
	const user = await client.query.UserByEmail({
		input: {
			email: "jens@wundergraph.com"
		}
	});
	if (user.status === "ok" && user.body.data.db_findFirstUser !== null){
		return
	}
	const out = await client.mutation.CreateUser({
		input: {
			name: "Jens",
			bio: "Founder@WunderGraph",
			email: "jens@wundergraph.com",
			title: "Welcome to WunderGraph!",
			content: "This is WunderGraph =)",
			published: true
		}
	});
	console.log("seed:out", JSON.stringify(out))
}

seed()
