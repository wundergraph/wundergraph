import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/*
* {
			name: 'Jens',
			bio: 'Founder@WunderGraph',
			email: 'jens@wundergraph.com',
			title: 'Welcome to WunderGraph!',
			content: 'This is WunderGraph =)',
			published: true,
		}
* */

async function main() {
	const jens = await prisma.user.findFirst({
		where: {
			email: {
				equals: 'jens@wundergraph.com',
			},
		},
	});
	if (jens) {
		console.log('jens found', jens);
		const rawJens = await prisma.$executeRaw<
			Array<{ id: string; email: string; name: string }>
		>`SELECT id,email,name FROM "User" WHERE email = ${jens.email}`;
		console.log('rawJens', rawJens);
		return;
	}
	const user = await prisma.user.create({
		data: {
			name: 'Jens',
			email: 'jens@wundergraph.com',
		},
	});
	console.log('user', user);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
