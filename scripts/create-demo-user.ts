import PocketBase from 'pocketbase';

async function main() {
	const pb = new PocketBase('http://127.0.0.1:8090');
	await pb.collection('_superusers').authWithPassword('admin@ledgerlens.test', 'Admin-Demo-12345!');
	console.log('Authenticated as superuser');
	const users = await pb.collection('users').getFullList();
	console.log('Existing users:', users.length);
	users.forEach((u: any) => console.log(' -', u.email, u.verified));
	try {
		const user = await pb.collection('users').create({
			email: 'reviewer@ledgerlens.test',
			password: 'Demo-Reviewer-123!',
			passwordConfirm: 'Demo-Reviewer-123!',
			emailVisibility: true
		});
		console.log('Created user:', user.id);
	} catch (e: any) {
		console.log('Create failed:', e.message);
	}
}

main();
