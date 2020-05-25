import { Telegraf, Middleware } from 'telegraf';
import { InlineKeyboardButton } from 'telegram-typings';

import { values } from 'shared';
import {
	DeleteMonitorCallback,
	DeleteMonitorState,
	DeleteAllMonitorState
} from 'plk-bot/handlers/delete-monitor/delete-monitor-model';
import { addBackButton, paginationV2, createInlineKey } from 'helpers/keyboardHelper';
import { Commands, CallBackQueries, Monitor } from 'plk-bot/models';
import { IPlkBotContext } from 'plk-bot';

export function setDeleteMonitorsHandlers(telegraf: Telegraf<IPlkBotContext>) {
	telegraf.on('callback_query', onCallback);
	telegraf.command(Commands.DeleteMonitor, onDeleteMonitorCommand);
	telegraf.command(Commands.DeleteOutdatedMonitors, onDeleteOutdatedMonitorsCommand);
}

function onCallback(context: IPlkBotContext, next: Middleware<IPlkBotContext>) {
	const result = context.callbackQuery.data.split(':');
	const callBack = result[0];
	const callbackData = result.slice(1).join(':');

	switch (callBack) {
		case CallBackQueries.DeleteMonitor:
			return onDeleteCallback(context, callbackData);
		case CallBackQueries.DeleteAllMonitor:
			return onDeleteAllCallback(context, callbackData);
		default:
			return next(context);
	}
}

function onDeleteCallback(context: IPlkBotContext, callbackData: string) {
	const deleteMonitor = new DeleteMonitorCallback(callbackData);

	switch (deleteMonitor.state) {
		case DeleteMonitorState.ChooseToDelete:
			return monitorsToDelete(context, deleteMonitor);
		case DeleteMonitorState.Confirm:
			return confirmDeleteMonitor(context, deleteMonitor);
		case DeleteMonitorState.Delete:
			return deleteMonitorCallBackQuery(context, deleteMonitor);
	}
}

function onDeleteAllCallback(context: IPlkBotContext, callbackData: string) {
	const state = callbackData as DeleteAllMonitorState;

	switch (state) {
		case DeleteAllMonitorState.Confirm:
			return confirmDeleteAllOutdatedMonitor(context);
		case DeleteAllMonitorState.Cancel:
			return onCancelDeleteAllOutdatedMonitors(context);
		case DeleteAllMonitorState.Delete:
			return deleteAllOutdatedMonitor(context);
	}
}

function callbackDeleteString(monitorCallBack: DeleteMonitorCallback) {
	return `${CallBackQueries.DeleteMonitor}:${monitorCallBack}`;
}

function callbackDeleteAllString(state: DeleteAllMonitorState) {
	return `${CallBackQueries.DeleteAllMonitor}:${state}`;
}

function onDeleteMonitorCommand(context: IPlkBotContext) {
	return monitorsToDelete(context, new DeleteMonitorCallback());
}

async function isMonitorDeleted(context: IPlkBotContext, deleteMonitorCallback: DeleteMonitorCallback): Promise<boolean> {
	const monitor = context.getChatInfo().monitors[deleteMonitorCallback.id];

	if (!monitor) {
		await context.editOrSend(`Monitor was already deleted.`)
		return true;
	}

	return false;
}

async function deleteMonitorCallBackQuery(context: IPlkBotContext, deleteMonitoringCallback: DeleteMonitorCallback) {
	if (await isMonitorDeleted(context, deleteMonitoringCallback))
		return;

	const monitor = context.getChatInfo().monitors[deleteMonitoringCallback.id];

	return Promise.all([
		context.editOrSend(`Monitor ${Monitor.toString(monitor)} is deleted.`),
		context.service.deleteMonitor(context.chat.id, deleteMonitoringCallback.id)]);
}

function confirmDeleteMonitor(context: IPlkBotContext, deleteMonitorCallback: DeleteMonitorCallback) {
	const monitor = context.getChatInfo().monitors[deleteMonitorCallback.id];

	deleteMonitorCallback.state = DeleteMonitorState.Delete;
	const keyboard: InlineKeyboardButton[][] =
		[[createInlineKey('Confirm', callbackDeleteString(deleteMonitorCallback))]];

	deleteMonitorCallback.id = undefined;
	deleteMonitorCallback.state = DeleteMonitorState.ChooseToDelete;
	addBackButton(keyboard, callbackDeleteString(deleteMonitorCallback));

	return context.editOrSend(`Confirm deleting monitor ${Monitor.toString(monitor)}. ${monitor.alreadySend ? 'You will lose all data about available times for this monitor details.' : ''}`, keyboard);
}

function monitorsToDelete(context: IPlkBotContext, deleteMonitorCallback: DeleteMonitorCallback) {
	const chatMonitors = context.getChatInfo().monitors;
	const onPageCount = 5;

	const { message, keyboard } = paginationV2(values(chatMonitors), onPageCount, deleteMonitorCallback.page,
		() => 'To delete monitor click on it.\n',
		(monitors, start) => monitors.map((monitor, i) => {
			deleteMonitorCallback.state = DeleteMonitorState.Confirm;
			deleteMonitorCallback.id = monitor.id;
			return createInlineKey(`${i + start + 1}. ${Monitor.toString(monitor)}`, callbackDeleteString(deleteMonitorCallback));
		}),
		pageNumber => {
			deleteMonitorCallback.state = DeleteMonitorState.ChooseToDelete;
			deleteMonitorCallback.page = pageNumber - 1;
			return callbackDeleteString(deleteMonitorCallback);
		}
	);

	return context.editOrSend(message, keyboard);
}

function deleteAllOutdatedMonitor(context: IPlkBotContext) {
	const chatMonitors = context.getChatInfo().monitors;
	const monitorsToDelete = values(chatMonitors).filter(x => Monitor.isOutdated(x));

	return Promise.all<number | Monitor>([
		...monitorsToDelete.map(x => context.service.deleteMonitor(context.chat.id, x.id)),
		context.editOrSend(`All outdated monitors were deleted.`)]);
}

function confirmDeleteAllOutdatedMonitor(context: IPlkBotContext) {
	const keyboard: InlineKeyboardButton[][] = [
		[createInlineKey('Confirm', callbackDeleteAllString(DeleteAllMonitorState.Delete))],
		[createInlineKey('Cancel', callbackDeleteAllString(DeleteAllMonitorState.Cancel))]
	];

	return context.editOrSend(`Confirm deleting of all outdated monitors. You will lose all data about available times for these monitors.`, keyboard);
}

function onCancelDeleteAllOutdatedMonitors(context: IPlkBotContext) {
	return context.editOrSend(`Cancelled deletion of all outdated monitors.`);
}

function onDeleteOutdatedMonitorsCommand(context: IPlkBotContext) {
	confirmDeleteAllOutdatedMonitor(context);
}