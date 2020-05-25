import { startTelegraf, createTelegraf,  TelegrafRequestListener } from 'helpers/telegrafHelper';

const limit = 4096;

type TOptions = {
	token: string;
	botName: string;
	adminChatId: number;
}

function getOptions(): TOptions {
return {
		token: process.env.OFFERS_TOKEN,
		botName: process.env.OFFERS_BOT_NAME,
		adminChatId: +process.env.ADMIN_CHAT_ID
	};
}

export function initOffersBot(hostUrl: string, debugMode?: boolean): TelegrafRequestListener {
	const { botName, token, adminChatId } = getOptions();
	const telegraf = createTelegraf(adminChatId, token, botName);
	telegraf.start(context => context.reply('I am working!!!'));

	const requestListener = startTelegraf(telegraf, token, hostUrl, debugMode);

	return (req, res, next?) => {
		if (req.method !== 'POST' || req.url !== '/chatbot/offers') {
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
			res.setHeader('Access-Control-Allow-Origin', '*');

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