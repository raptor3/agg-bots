import Telegraf, { Middleware } from 'telegraf';

import { MyBotContext } from 'helpers/telegrafHelper';

export function initHandlers(telegraf: Telegraf<MyBotContext>) {
	telegraf.command('start', onStart);

	telegraf.on('message', onMessage);
}

function onStart(context: MyBotContext) {
	console.log(`Chat id: ${context.chat.id}`);
	const message = context.chat.id === context.adminChatId
		? 'Принимать ответы здесь'
		: 'Отвечать сюда';

	return context.reply(message);
}

async function onMessage(context: MyBotContext, next?: Middleware<MyBotContext>) {
	const { adminChatId, chat } = context;
	const { id } = chat;

	if (id === adminChatId) {
		if (!context.message.reply_to_message) {
			return next(context);
		}

		const { text } = context.message.reply_to_message;
		const userChatIdMatch = /\((\w+)\):/i.exec(text);

		if (!userChatIdMatch)
			return next(context);

		const [, userChatId] = userChatIdMatch;
		return context.telegram.sendMessage(userChatId, context.message.text);
	}

	const name = context.chat.username || `${context.chat.first_name} ${context.chat.last_name}`;
	const userLink = `[${name}](tg://user?id=${id})(${id}):`;

	return context.telegram.sendMessage(
		adminChatId,
		`${userLink} ${context.message.text}`,
		{ parse_mode: 'Markdown' } as any);
}