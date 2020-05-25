import { createTelegraf, MyBotContext, startTelegraf } from 'helpers/telegrafHelper';

import { initHandlers } from 'riddle-bot/handlers';

type TRiddleOptions = {
	adminChatId: number;
	botName: string;
	token: string;
};

function getOptions(): TRiddleOptions {
	return {
		adminChatId: +process.env.RIDDLE_ADMIN_CHAT_ID,
		token: process.env.RIDDLE_TOKEN,
		botName: process.env.RIDDLE_BOT_NAME,
	}
}

export function initRiddleBot(hostUrl: string, debugMode?: boolean) {
	const { token, botName, adminChatId } = getOptions();
	const telegraf = createTelegraf<MyBotContext>(adminChatId, token, botName);

	initHandlers(telegraf);
	return startTelegraf(telegraf, token, hostUrl, debugMode);
}