import { GatewayDispatchEvents } from 'discord-api-types/v10';
import { ClientQuest } from './src/client';

let currentUserId: string | null = null;

const client = new ClientQuest(process.env.TOKEN!);

/*
client.on(
	GatewayDispatchEvents.MessageCreate,
	async ({ data: message, api }) => {
		console.log('Message received:', message.content);
		if (message.content === 'ping' && message.author.id === currentUserId) {
			await api.channels.createMessage(message.channel_id, {
				content: 'pong',
			});
		}
	},
);
*/

client.once(GatewayDispatchEvents.Ready, async ({ data, api }) => {
	currentUserId = data.user.id;
	if (process.env.GITHUB_ACTIONS === 'true') {
		console.log('Logged in!');
	} else {
		console.log(`Logged in as @${data.user.username}`);
	}
	try {
		await client.fetchQuests(false);
		const questsValid = client.questManager!.filterQuestsValidToDo();
		console.log(`Found ${questsValid.length} valid quests to do.`);
		await Promise.allSettled(
			questsValid.map((quest) => client.questManager!.doingQuest(quest)),
		);
	} catch (error) {
		const formattedMessage = `Failed to process quests: ${
			error instanceof Error ? error.message : String(error)
		}`;
		console.error(formattedMessage);
		client.sendWebhookMessage(formattedMessage);
	}

	// ! Redeem rewards for completed quests
	// Todo: Cache quests
	/*
	await client.fetchQuests(false);
	const questsToRedeem = client.questManager!.filterQuestsValidToRedeem();
	console.log(`Found ${questsToRedeem.length} quests to redeem rewards for.`);
	for (const quest of questsToRedeem) {
		await client.questManager!.redeemQuest(quest);
	}
	*/
	// Disconnect
	console.log('All quests processed. Disconnecting...');
	await client.destroy();
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('[Error:] Unhandled Rejection', reason);
});

process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error.message);
});

client.connect();
