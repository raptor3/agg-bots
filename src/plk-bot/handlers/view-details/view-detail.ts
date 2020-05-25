import { Telegraf, Middleware } from 'telegraf';
import { InlineKeyboardButton } from 'telegram-typings';

import { paginationV2, addBackButton, createInlineKey } from 'helpers/keyboardHelper';
import { ViewDetailCallback, ViewDetailState } from 'plk-bot/handlers/view-details/view-detail-model';
import { CallBackQueries, Monitor } from 'plk-bot/models';
import { IPlkBotContext } from 'plk-bot';
import { isDefined } from 'shared';

export function setViewDetailHandlers(telegraf: Telegraf<IPlkBotContext>) {
	telegraf.on('callback_query', onCallback);
}

async function onCallback(context: IPlkBotContext, next: Middleware<IPlkBotContext>) {
	const result = context.callbackQuery.data.split(':');
	const callBack = result[0];
	const callbackData = result.slice(1).join(':');

	if (callBack === CallBackQueries.ViewDetail) {
		const viewDetailCallback = ViewDetailCallback.createFromString(callbackData);

		if (await isMonitorDeleted(context, viewDetailCallback))
			return;

		switch (viewDetailCallback.state) {
			case ViewDetailState.ChooseTechnology:
				return chooseTechnology(context, viewDetailCallback);
			case ViewDetailState.ChooseDate:
				return chooseDate(context, viewDetailCallback);
			case ViewDetailState.ViewDateTimes:
				return viewTimes(context, viewDetailCallback);
			case ViewDetailState.CreatePoll:
				return createPoll(context, viewDetailCallback);
		}
	} else {
		return next(context);
	}
}

function callbackString(monitorCallBack: ViewDetailCallback) {
	return `${CallBackQueries.ViewDetail}:${monitorCallBack}`;
}

async function isMonitorDeleted(context: IPlkBotContext, callBack: ViewDetailCallback): Promise<boolean> {
	const monitor = context.getChatInfo().monitors[callBack.monitorId];

	if (!monitor) {
		await context.editOrSend(`You cannot see this information. Monitor was deleted.`)
		return true;
	}

	return false;
}

export function startViewDetail(context: IPlkBotContext, monitor: Monitor) {
	return chooseTechnology(context, ViewDetailCallback.createFromId(monitor.id));
}

function chooseTechnology(context: IPlkBotContext, callBack: ViewDetailCallback) {
	const monitor = context.getChatInfo().monitors[callBack.monitorId];

	if (monitor.detail.length === 1) {
		callBack.state = ViewDetailState.ChooseDate;
		callBack.technologyIndex = 0;
		callBack.datePage = 0;
		return chooseDate(context, callBack);
	}

	callBack.state = ViewDetailState.ChooseDate;
	callBack.datePage = 0;
	const keyboard = monitor.detail.map((x, i) => {
		callBack.technologyIndex = i;
		return [createInlineKey(x.technologyId, callbackString(callBack))]
	});
	const message = `${baseMessageForMonitor(monitor)}\nChoose technology to see available times.`;
	return context.editOrSend(message, keyboard);
}

function chooseDate(context: IPlkBotContext, callBack: ViewDetailCallback) {
	const monitor = context.getChatInfo().monitors[callBack.monitorId];
	const techDetail = monitor.detail[callBack.technologyIndex];

	if (techDetail.detail.length === 1) {
		callBack.state = ViewDetailState.ViewDateTimes;
		callBack.dateIndex = 0;
		callBack.datePage = 0;
		return viewTimes(context, callBack);
	}

	callBack.state = ViewDetailState.ViewDateTimes;
	const { message, keyboard } = paginationV2(techDetail.detail, 5, callBack.datePage,
		() => `${baseMessageForMonitor(monitor)}\nChoose date to see available times for technology - ${techDetail.technologyId}.`,
		(details, start) => details.map((d, i) => {
			callBack.dateIndex = i + start;
			return createInlineKey(`${callBack.dateIndex + 1}. ${d.date}`, callbackString(callBack));
		}),
		(pageNumber: number) => {
			callBack.datePage = pageNumber - 1;
			callBack.state = ViewDetailState.ChooseDate;

			return callbackString(callBack);
		}
	);

	if (context.isGroupChat() && techDetail.detail.length > 1) {
		callBack.state = ViewDetailState.CreatePoll;
		callBack.dateIndex = undefined;
		addPollButton(keyboard, callbackString(callBack));
	}

	if (monitor.detail.length !== 1) {
		callBack.state = ViewDetailState.ChooseTechnology;
		callBack.datePage = 0;
		addBackButton(keyboard, callbackString(callBack));
	}

	return context.editOrSend(message, keyboard);
}

function viewTimes(context: IPlkBotContext, callBack: ViewDetailCallback) {
	const monitor = context.getChatInfo().monitors[callBack.monitorId];
	const techDetail = monitor.detail[callBack.technologyIndex];
	const dateDetail = techDetail.detail[callBack.dateIndex];

	const keyboard: InlineKeyboardButton[][] = [];
	if (context.isGroupChat() && dateDetail.times.length > 1) {
		callBack.state = ViewDetailState.CreatePoll;
		addPollButton(keyboard, callbackString(callBack));
	}
	if (techDetail.detail.length !== 1) {
		callBack.state = ViewDetailState.ChooseDate;
		addBackButton(keyboard, callbackString(callBack));
	} else if (monitor.detail.length !== 1) {
		callBack.state = ViewDetailState.ChooseTechnology;
		addBackButton(keyboard, callbackString(callBack));
	}

	return context.editOrSend(`${baseMessageForMonitor(monitor)}\nAvailable times for technology ${techDetail.technologyId} on ${dateDetail.date}\n${dateDetail.times.join('\n')}`, keyboard);
}

function createPoll(context: IPlkBotContext, callBack: ViewDetailCallback) {
	return isDefined(callBack.dateIndex)
		? createPollForTime(context, callBack)
		: createPollForDate(context, callBack);
}

function createPollForDate(context: IPlkBotContext, callBack: ViewDetailCallback) {
	const monitor = context.getChatInfo().monitors[callBack.monitorId];
	const techDetail = monitor.detail[callBack.technologyIndex];

	const dates = techDetail.detail.map(d => d.date);
	return context.replyWithPoll(`Choose all appropriate dates for you to watch ${monitor.film.name}`, dates, {
		allows_multiple_answers: true,
		is_anonymous: false
	});
}

function createPollForTime(context: IPlkBotContext, callBack: ViewDetailCallback) {
	const monitor = context.getChatInfo().monitors[callBack.monitorId];
	const techDetail = monitor.detail[callBack.technologyIndex];
	const dateDetail = techDetail.detail[callBack.dateIndex];

	return context.replyWithPoll(`Choose all appropriate times for you to watch ${monitor.film.name} on ${dateDetail.date}`, dateDetail.times, {
		allows_multiple_answers: true,
		is_anonymous: false
	});
}

function baseMessageForMonitor(monitor: Monitor) {
	return monitor.alreadySend
		? `You can buy ticket film ${monitor.film.name}.`
		: `Please prepare, tickets for film ${monitor.film.name} will be available soon.`;
}

function addPollButton(keyboard: InlineKeyboardButton[][], callbackData: string) {
	keyboard.push([createInlineKey(`Poll`, callbackData)]);
}