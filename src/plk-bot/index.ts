import { createTelegraf, startTelegraf, MyBotContext as IMyBotContext } from 'helpers/telegrafHelper';
import { PlkRepository } from 'plk-bot/plk-repository';
import { PlkAgent } from 'plk-bot/plk-agent';
import { PlkService } from 'plk-bot/plk-service';
import { initHandlers } from 'plk-bot/handlers/plk-handlers';
import { Chat } from 'plk-bot/models';

type TOptions = {
	token: string;
	botName: string;
	plkUrlFilms: string;
	plkUrlShowTimes: string;
	dbUrl: string;
	adminChatId: number;
}

function getOptions(): TOptions {
	return {
		token: process.env.PLK_TOKEN,
		botName: process.env.PLK_BOT_NAME,
		plkUrlFilms: process.env.PLK_URL_FILMS || 'http://127.0.0.1:8081/films',
		plkUrlShowTimes: process.env.PLK_URL_SHOWTIMES || 'http://127.0.0.1:8081/showtimes',
		dbUrl: `https://${process.env.PLK_DB_ID}.firebaseio.com`,
		adminChatId: +process.env.ADMIN_CHAT_ID
	};
}

export async function initPlkBot(hostUrl: string, debugMode?: boolean) {
	const { token, botName, plkUrlFilms, plkUrlShowTimes, dbUrl, adminChatId } = getOptions();

	const repository = new PlkRepository(dbUrl);
	const plkAgent = new PlkAgent(plkUrlFilms, plkUrlShowTimes);

	const service = new PlkService(repository);
	const telegraf = createTelegraf<IPlkBotContext>(adminChatId, token, botName);
	initMyContext(telegraf.context, service);

	plkAgent.onError = json => {
		console.log(`Error During: ${json}`);
		telegraf.telegram.sendMessage(adminChatId, `Error : ${json.name}`);
	}

	await repository.init();
	console.log('start');
	initHandlers(telegraf, plkAgent, service);
	return startTelegraf(telegraf, token, hostUrl, debugMode);
}

function initMyContext(context: IPlkBotContext, service: PlkService) {
	context.service = service;
	context.getChatInfo = getChatInfoFunction;
}

function getChatInfoFunction(): Chat {
	const context: IPlkBotContext = this;
	return context.service.getChat(context.chat.id);
}

export interface IPlkBotContext extends IMyBotContext {
	service: PlkService;
	getChatInfo(): Chat;
}