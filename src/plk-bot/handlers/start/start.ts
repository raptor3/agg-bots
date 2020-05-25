import Telegraf from 'telegraf';

import { values } from 'shared';
import { Commands } from 'plk-bot/models';
import { IPlkBotContext } from 'plk-bot';

export function setStartHandlers(telegraf: Telegraf<IPlkBotContext>) {
	telegraf.start(onStartCommand);
	telegraf.command(Commands.On, onTurnOnCommand);
	telegraf.command(Commands.Off, onTurnOffCommand);
}

function onStartCommand(context: IPlkBotContext) {
	context.getChatInfo();
	const availableCommands = values(Commands)
		.filter(x => context.chat.id === context.adminChatId || x !== Commands.Off && x !== Commands.On);
	return context.reply(`Welcome!!\nYou can use commands:\n${availableCommands.map(x => `/${x}`).join('\n')}`);
}

function onTurnOnCommand(context: IPlkBotContext) {
	if (context.chat.id === context.adminChatId) {
		console.log('on');

		return Promise.all([
			context.service.updateApplicationOn(true),
			context.reply('Bot is on')]);
	}
}

function onTurnOffCommand(context: IPlkBotContext) {
	if (context.chat.id === context.adminChatId) {
		console.log('off');

		return Promise.all([
			context.service.updateApplicationOn(false),
			context.reply('Bot is off')]);
	}
}