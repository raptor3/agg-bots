import { Telegraf, Middleware } from 'telegraf';
import { InlineKeyboardButton } from 'telegram-typings';

import { addBackButton, paginationV2, createInlineKey } from 'helpers/keyboardHelper';
import { MonitorCallback, BuildCallbackState } from 'plk-bot/handlers/create-monitor/create-monitor-model';
import { Commands, CallBackQueries, BotState, Monitor } from 'plk-bot/models';
import { IPlkBotContext } from 'plk-bot';

export function setCreateMonitorHandlers(telegraf: Telegraf<IPlkBotContext>) {
	telegraf.on('text', onMessage);
	telegraf.on('callback_query', onCallback);
	telegraf.command(Commands.CreateMonitor, onCreateMonitorCommand);
}

function onCallback(context: IPlkBotContext, next: Middleware<IPlkBotContext>) {
	const result = context.callbackQuery.data.split(':');
	const callBack = result[0];
	const callbackData = result.slice(1).join(':');

	if (callBack === CallBackQueries.CreateMonitor) {
		const monitoringCallBack = MonitorCallback.CreateFromString(callbackData, context.service.getFilteredFilms);
		switch (monitoringCallBack.state) {
			case BuildCallbackState.ChooseFilm:
				return searchFilm(context, monitoringCallBack);
			case BuildCallbackState.ChooseTechnology:
				return chooseTechnology(context, monitoringCallBack);
			case BuildCallbackState.SpecifyDateOrNot:
				return specifyDateOrNot(context, monitoringCallBack);
			case BuildCallbackState.ChooseYear:
				return chooseYear(context, monitoringCallBack);
			case BuildCallbackState.ChooseMonth:
				return chooseMonth(context, monitoringCallBack);
			case BuildCallbackState.ChooseDate:
				return chooseDay(context, monitoringCallBack);
			case BuildCallbackState.Confirm:
				return confirmCreateMonitor(context, monitoringCallBack);
			case BuildCallbackState.Create:
				return createMonitor(context, monitoringCallBack);
			default:
				return searchFilm(context, monitoringCallBack);
		}
	} else {
		return next(context);
	}
}

function callbackString(monitorCallBack: MonitorCallback) {
	return `${CallBackQueries.CreateMonitor}:${monitorCallBack}`;
}

function onMessage(context: IPlkBotContext, next: Function) {
	if (!context.message.text || context.message.text.startsWith('/')) {
		return next();
	}

	switch (context.getChatInfo().state) {
		case BotState.CreateMonitoring:
			onSearchMessage(context);
			break;
		default:
			return next();
	}
}

function onCreateMonitorCommand(context: IPlkBotContext) {
	return Promise.all([
		context.service.updateBotState(context.chat.id, BotState.CreateMonitoring),
		context.reply('Reply to this message with movie name.\nYou may search for many by putting each new on a new line.')]);
}

function onSearchMessage(context: IPlkBotContext) {
	return Promise.all<void | number>([
		context.service.updateBotState(context.chat.id, BotState.None),
		...context.message.text.split('\n').map(search => searchFilm(context, MonitorCallback.Create(search.trim())))]);
}

function searchFilm(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	let filteredFilms = context.service.getFilteredFilms(monitorCallBack.searchedFilm);

	if (filteredFilms.length === 0) {
		context.editOrSend(`There are no film with name that contains '${monitorCallBack.searchedFilm}'.\nPlease use /${Commands.CreateMonitor} to search again.`);
		return;
	}

	const onPageCount = 5;
	const { message, keyboard } = paginationV2(filteredFilms, onPageCount, monitorCallBack.page,
		() => `Choose film with name that contains '${monitorCallBack.searchedFilm}' from the list.\nIf you want to search again use /${Commands.CreateMonitor} command.`,
		(films, start) => films.map((film, i) => {
			monitorCallBack.state = BuildCallbackState.ChooseTechnology;
			monitorCallBack.index = i + start;
			return createInlineKey(`${monitorCallBack.index + 1}. ${film.name}`, callbackString(monitorCallBack));
		}),
		pageNumber => {
			monitorCallBack.state = BuildCallbackState.ChooseFilm;
			monitorCallBack.page = pageNumber - 1;
			return callbackString(monitorCallBack);
		}
	);

	return context.editOrSend(message, keyboard);
}

function specifyDateOrNot(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	const message = `Do you want to specify date for film ${monitorCallBack.chosenFilm.name}?`;
	const keyboard: InlineKeyboardButton[][] = [];
	const firstRow: InlineKeyboardButton[] = [];
	keyboard.push(firstRow);

	monitorCallBack.state = BuildCallbackState.Confirm;
	monitorCallBack.withoutDate = true;
	firstRow.push(createInlineKey('No', callbackString(monitorCallBack)));

	monitorCallBack.state = BuildCallbackState.ChooseYear;
	monitorCallBack.withoutDate = false;
	firstRow.push(createInlineKey('Yes', callbackString(monitorCallBack)));

	monitorCallBack.state = BuildCallbackState.ChooseTechnology;
	addBackButton(keyboard, callbackString(monitorCallBack));
	return context.editOrSend(message, keyboard);
}

function chooseTechnology(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	const message = `Choose technology for film ${monitorCallBack.chosenFilm.name}.`;
	const keyboard = monitorCallBack.chosenFilm.technologies.map((technology, i) => {
		monitorCallBack.state = BuildCallbackState.SpecifyDateOrNot;
		monitorCallBack.chosenTechnology = technology.name;
		return [createInlineKey(`${i + 1}. ${technology.name}`, callbackString(monitorCallBack))];
	});
	monitorCallBack.state = BuildCallbackState.SpecifyDateOrNot;
	monitorCallBack.chosenTechnology = 'any';
	keyboard.push([createInlineKey(`any`, callbackString(monitorCallBack))])

	monitorCallBack.state = BuildCallbackState.ChooseFilm;
	addBackButton(keyboard, callbackString(monitorCallBack));
	return context.editOrSend(message, keyboard);
}

function chooseYear(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	const message = `Film will be shown from ${monitorCallBack.chosenFilm.sinceDate} till ${monitorCallBack.chosenFilm.endDate}.\nChoose year for film ${monitorCallBack.chosenFilm.name}.`;

	const sinceDate = new Date(monitorCallBack.chosenFilm.sinceDate);
	const endDate = new Date(monitorCallBack.chosenFilm.endDate);

	const keyboard: InlineKeyboardButton[][] = [];
	for (let year = sinceDate.getFullYear(); year <= endDate.getFullYear(); year++) {
		monitorCallBack.state = BuildCallbackState.ChooseMonth;
		monitorCallBack.year = year;
		keyboard.push([createInlineKey(`${year}`, callbackString(monitorCallBack))]);
	}

	monitorCallBack.state = BuildCallbackState.SpecifyDateOrNot;
	addBackButton(keyboard, callbackString(monitorCallBack));
	return context.editOrSend(message, keyboard);
}

function chooseMonth(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	const message = `Film will be shown from ${monitorCallBack.chosenFilm.sinceDate} till ${monitorCallBack.chosenFilm.endDate}.\nChoose month for film ${monitorCallBack.chosenFilm.name} for ${monitorCallBack.year}.`;

	const sinceDate = new Date(monitorCallBack.chosenFilm.sinceDate);
	const endDate = new Date(monitorCallBack.chosenFilm.endDate);
	let sinceMonth = sinceDate.getMonth() + 1;
	let endMonth = endDate.getMonth() + 1;

	if (sinceDate.getFullYear() !== endDate.getFullYear() && monitorCallBack.year === sinceDate.getFullYear()) {
		endMonth = 12;
	}
	if (sinceDate.getFullYear() !== endDate.getFullYear() && monitorCallBack.year === endDate.getFullYear()) {
		sinceMonth = 1;
	}

	const keyboard: InlineKeyboardButton[][] = [];
	for (let month = sinceMonth; month <= endMonth; month++) {
		monitorCallBack.state = BuildCallbackState.ChooseDate;
		monitorCallBack.month = month;
		keyboard.push([createInlineKey(`${month}`, callbackString(monitorCallBack))]);
	}

	monitorCallBack.state = BuildCallbackState.ChooseYear;
	addBackButton(keyboard, callbackString(monitorCallBack));
	return context.editOrSend(message, keyboard);
}

function chooseDay(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	const message = `Film will be shown from ${monitorCallBack.chosenFilm.sinceDate} till ${monitorCallBack.chosenFilm.endDate}.\nChoose day for film ${monitorCallBack.chosenFilm.name} for ${monitorCallBack.year}-${monitorCallBack.month}`;
	const sinceDate = new Date(monitorCallBack.chosenFilm.sinceDate);
	const endDate = new Date(monitorCallBack.chosenFilm.endDate);
	let sinceDay = sinceDate.getDate();
	let endDay = endDate.getDate();

	if (sinceDate.getMonth() !== endDate.getMonth() && monitorCallBack.month === sinceDate.getMonth() + 1) {
		endDay = new Date(Date.UTC(sinceDate.getFullYear(), sinceDate.getMonth() + 1, 0)).getDate();
	}
	if (sinceDate.getMonth() !== endDate.getMonth() && monitorCallBack.month === endDate.getMonth() + 1) {
		sinceDay = 1;
	}

	const keyboard: InlineKeyboardButton[][] = [];
	let currentRow: InlineKeyboardButton[];
	for (let day = sinceDay, i = 0; day <= endDay; day++ , i++) {
		if (i % 5 === 0) {
			keyboard.push(currentRow = []);
		}
		monitorCallBack.day = day;
		monitorCallBack.state = BuildCallbackState.Confirm;
		currentRow.push(createInlineKey(`${day}`, callbackString(monitorCallBack)));
	}

	monitorCallBack.state = BuildCallbackState.ChooseMonth;
	addBackButton(keyboard, callbackString(monitorCallBack));
	return context.editOrSend(message, keyboard);
}

function confirmCreateMonitor(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	const message = `Please, confirm creating monitor for film ${monitorCallBack.chosenFilm.name} with ${monitorCallBack.chosenTechnology} technology on ${monitorCallBack.withoutDate ? 'any' :monitorCallBack.formattedDate} date`;

	monitorCallBack.state = BuildCallbackState.Create;
	const keyboard: InlineKeyboardButton[][] =
		[[createInlineKey('Confirm', callbackString(monitorCallBack))]];

	monitorCallBack.state = BuildCallbackState.ChooseDate;
	if (monitorCallBack.withoutDate) {
		monitorCallBack.state = BuildCallbackState.SpecifyDateOrNot;
	}
	addBackButton(keyboard, callbackString(monitorCallBack));
	return context.editOrSend(message, keyboard);
}

function createMonitor(context: IPlkBotContext, monitorCallBack: MonitorCallback) {
	const monitor = monitorCallBack.toMonitor();
	const message = `Monitoring for film ${Monitor.toString(monitor)} is created.`;

	return Promise.all([
		context.service.addMonitor(context.chat.id, monitor),
		context.editOrSend(message)]);
}
