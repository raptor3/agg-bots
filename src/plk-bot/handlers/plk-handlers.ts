import { Telegraf } from 'telegraf';

import { createContextByChatId, createContextForAdmin } from 'helpers/telegrafHelper';
import { setIntervalByMinutes, unique } from 'shared';

import { setCreateMonitorHandlers } from 'plk-bot/handlers/create-monitor/create-monitor';
import { setDeleteMonitorsHandlers } from 'plk-bot/handlers/delete-monitor/delete-monitors';
import { startViewDetail, setViewDetailHandlers } from 'plk-bot/handlers/view-details/view-detail';
import { setViewMonitorsHandlers } from 'plk-bot/handlers/view-monitors/view-monitors';
import { setStartHandlers } from 'plk-bot/handlers/start/start';
import { DetailTechnology, DetailDate, IShowTime, Monitor } from 'plk-bot/models';
import { IPlkAgent } from 'plk-bot/plk-agent';
import { PlkService } from 'plk-bot/plk-service';
import { IPlkBotContext } from 'plk-bot';

export function initHandlers(telegraf: Telegraf<IPlkBotContext>, plkAgent: IPlkAgent, service: PlkService) {
	setStartHandlers(telegraf);
	setViewMonitorsHandlers(telegraf);
	setDeleteMonitorsHandlers(telegraf);
	setCreateMonitorHandlers(telegraf);
	setViewDetailHandlers(telegraf);

	updateFilms(plkAgent, service);
	setIntervalByMinutes(() => service.getApplicationOn() && updateFilms(plkAgent, service), 60 * 24);
	setIntervalByMinutes(() => service.getApplicationOn() && check(telegraf, plkAgent), 2);
	createContextForAdmin(telegraf).then(c => c.editOrSend('Bot Loaded!'));
}

async function check(telegraf: Telegraf<IPlkBotContext>, plkAgent: IPlkAgent) {
	const showTimesPromise = plkAgent.getShowTimes();
	const monitors = telegraf.context.service.getAllNotSentMonitors();
	const showTimes = await showTimesPromise;

	console.log('Checking');
	await Promise.all(monitors.map(monitor => checkMonitor(monitor, showTimes, telegraf)));
	console.log('Checked');
}

async function checkMonitor(monitor: Monitor, showTimes: IShowTime[], telegraf: Telegraf<IPlkBotContext>): Promise<void> {
	const filteredShows = showTimes.filter(x => x.movieId === monitor.film.uid
			&& (monitor.date === 'any' || x.date === monitor.date)
			&& (monitor.technology === 'any' || x.technologyId.toLowerCase() === monitor.technology.toLowerCase()));

	if (filteredShows.length === 0 || (monitor.prepare && filteredShows.every(x => x.website.hidden === 'y')))
		return;

	if (!filteredShows.every(x => x.website.hidden === 'y'))
		monitor.alreadySend = true;

	monitor.detail = createDetail(filteredShows);
	monitor.prepare = true;
	telegraf.context.service.updateMonitor(monitor.chatId, monitor.id);
	startViewDetail(await createContextByChatId(telegraf, monitor.chatId), monitor);
}

function createDetail(filteredShows: IShowTime[]): DetailTechnology[] {
	return unique(filteredShows.map(x => x.technologyId))
		.map(t => new DetailTechnology(t, createDateDetail(filteredShows.filter(x => x.technologyId === t))));
}

function createDateDetail(filteredShows: IShowTime[]): DetailDate[] {
	return unique(filteredShows.map(x => x.date))
		.map(x => new DetailDate(x, createAvailableTimes(filteredShows.filter(s => s.date === x))));
}

function createAvailableTimes(filteredShows: IShowTime[]): string[] {
	return filteredShows.map(s => s.timeBegin.split(' ')[1]);
}

async function updateFilms(plkAgent: IPlkAgent, service: PlkService) {
	service.setFilms(await plkAgent.getFilms());
}