import { createTelegraf, TelegrafRequestListener, startTelegraf } from 'helpers/telegrafHelper';

type TBotOptions = {
	botName: string,
	token: string,
	adminChatId: number
};

const limit = 4096;

function getOptions(): TBotOptions {
	return {
		adminChatId: +process.env.ADMIN_CHAT_ID,
		token: process.env.ERCH_TOKEN,
		botName: process.env.ERCH_BOT_NAME
	};
}

export function initErchBot(hostUrl: string, debugMode?: boolean): TelegrafRequestListener {
	const { botName, token, adminChatId } = getOptions();
	const telegraf = createTelegraf(adminChatId, token, botName);
	telegraf.start(context => context.reply('I am working!!!'));

	const requestListener = startTelegraf(telegraf, token, hostUrl, debugMode);

	return (req, res, next?) => {
		if (req.method !== 'POST' || req.url !== '/chatbot/error') {
			return requestListener
				? requestListener(req, res, next)
				: next();
		}

		let body = ''
		req.on('data', (chunk) => {
			body += chunk.toString();
		})
		req.on('end', () => {
			const bodyLength = body.length;
			const parts = Math.ceil(bodyLength / limit);
			const messagesToSend = [...new Array(parts).keys()].map(i => body.substring(i * limit, (i + 1) * limit));

			Promise.all(messagesToSend.map(textToSend => telegraf.telegram.sendMessage(adminChatId, textToSend, { disable_web_page_preview: true } as any)))
				.then(() => {
					if (!res.finished) {
						res.end();
					}
				})
				.catch((err) => {
					console.log(err);
					res.writeHead(500);
					res.end();
				})
		})
	};
}