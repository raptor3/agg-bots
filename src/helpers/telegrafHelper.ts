import { IncomingMessage, ServerResponse } from 'http';

import Telegraf from 'telegraf'
import { ContextMessageUpdate } from 'telegraf'
import { InlineKeyboardButton } from 'telegram-typings';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

export type TelegrafRequestListener = (req: IncomingMessage, res: ServerResponse, next?: () => void) => void;

export interface MyBotContext extends ContextMessageUpdate {
	adminChatId: number;
	editOrSend(message: string, keyboard?: InlineKeyboardButton[][]): Promise<number>;
	replyWithPoll(question: string, options: string[], extra?: { is_anonymous: boolean, allows_multiple_answers: boolean }): Promise<void>;
	isGroupChat(): boolean;
}

function isGroupChat() {
	const context: MyBotContext = this;
	return context.chat.type === 'group' || context.chat.type === 'supergroup';
}

export async function createContextByChatId<TContext extends MyBotContext>(telegraf: Telegraf<TContext>, chatId: number): Promise<TContext> {
	return {
		...telegraf.context,
		chat: await telegraf.telegram.getChat(chatId),
		reply: (text: string, extra?: ExtraReplyMessage) => telegraf.telegram.sendMessage(chatId, text, extra),
	};
}

export function createContextForAdmin<TContext extends MyBotContext>(telegraf: Telegraf<TContext>): Promise<TContext> {
	return createContextByChatId(telegraf, telegraf.context.adminChatId);
}

export function createTelegraf<TContext extends MyBotContext>(adminChatId: number, token: string, botName: string): Telegraf<TContext> {
	const telegraf: Telegraf<TContext> = new Telegraf(token, { username: botName });

	initMyBotContext(telegraf, adminChatId);
	return telegraf;
}

export function startTelegraf<TContext extends MyBotContext>(telegraf: Telegraf<TContext>, path: string, hostUrl: string, debug?: boolean): TelegrafRequestListener {
	if (debug) {
		telegraf.startPolling();
	} else {
		telegraf.telegram.setWebhook(hostUrl + path);
		return telegraf.webhookCallback(`/${path}`);
	}
}

function initMyBotContext(telegraf: Telegraf<MyBotContext>, adminChatId: number) {
	const context = telegraf.context;
	context.adminChatId = adminChatId;
	context.editOrSend = editOrSendFunction;
	context.isGroupChat = isGroupChat;
}

async function editOrSendFunction(message: string, keyboard?: InlineKeyboardButton[][]): Promise<number> {
	const context: MyBotContext = this;
	const extra = keyboard
		? { reply_markup: { inline_keyboard: keyboard } }
		: undefined;

	if (context.callbackQuery) {
		await context.editMessageText(message, extra);
		return context.callbackQuery.message.message_id;
	} else {
		const msg = await context.reply(message, extra);
		return msg.message_id || context.message.message_id + 1;
	}
}