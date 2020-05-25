import { Telegraf, Middleware } from 'telegraf';

import { paginationV2 } from 'helpers/keyboardHelper';
import { values } from 'shared';
import { CallBackQueries, Commands, Monitor } from 'plk-bot/models';
import { IPlkBotContext } from 'plk-bot';

export function setViewMonitorsHandlers(telegraf: Telegraf<IPlkBotContext>) {
	telegraf.on('callback_query', onCallback);
	telegraf.command(Commands.ViewMonitors, onViewMonitorsCommand);
}

function onCallback(context: IPlkBotContext, next: Middleware<IPlkBotContext>) {
	const result = context.callbackQuery.data.split(':');
	const callBack = result[0];

	if (callBack === CallBackQueries.ViewMonitor) {
		return viewMonitors(context, +result[1]);
	} else {
		return next(context);
	}
}

function onViewMonitorsCommand(context: IPlkBotContext) {
	return viewMonitors(context, 0);
}

function viewMonitors(context: IPlkBotContext, page: number) {
	const chatMonitors = values(context.getChatInfo().monitors).sort(compareMonitors);
	const onPageCount = 5;

	const { message, keyboard } = paginationV2(chatMonitors, onPageCount, page,
		(monitors, start) => `To delete monitor use /${Commands.DeleteMonitor}\n${monitors.map((m, i) => `${i + start + 1}. (${m.film.sinceDate}) ${Monitor.toString(m)}`).join('\n')}`,
		() => [],
		pageNumber => `${CallBackQueries.ViewMonitor}:${pageNumber - 1}`
	);

	return context.editOrSend(message, keyboard);
}

function compareMonitors(m1: Monitor, m2: Monitor) {
	return compareTwoDates(new Date(m1.film.sinceDate), new Date(m2.film.sinceDate));
}

function compareTwoDates(d1: Date, d2: Date): number {
	return +(d1 > d2) - +(d1 < d2);
}