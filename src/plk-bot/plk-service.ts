import { IPlkRepository } from 'plk-bot/plk-repository';
import { Chat, BotState, Film, Monitor } from 'plk-bot/models';
import { values, keys } from 'shared';

export class PlkService {
	constructor(private database: IPlkRepository) { }

	public getChat(chatId: number): Chat {
		const chat = this.database.chats[chatId] ?? this.initChat(chatId);
		if (!chat.monitors) {
			chat.monitors = {};
		}
		return chat;
	}

	private initChat(chatId: number): Chat {
		const chat = this.database.chats[chatId] = {
			state: BotState.None,
			monitors: {},
			nextMonitorId: 1
		} as Chat;
		this.updateChat(chatId);
		return chat;
	}

	public getApplicationOn(): boolean {
		return this.database.applicationOn;
	}

	public getFilms(): Film[] {
		return this.database.films;
	}

	public setFilms(films: Film[]): void {
		this.database.films = films;
	}

	public getAllNotSentMonitors(): Monitor[] {
		return [].concat(
			...keys(this.database.chats)
				.map(key => this.getChat(+key))
				.map(chat => values(chat.monitors).filter(m => !m.alreadySend)));
	}

	public async updateChat(chatId: number, updateFunction?: (chat: Chat) => unknown) {
		if (updateFunction)
			await updateFunction(this.getChat(chatId));
		await this.database.updateChat(chatId);
	}

	public async updateApplicationOn(on: boolean) {
		this.database.applicationOn = on;
		await this.database.updateApplicationOn();
	}

	public getFilteredFilms = (search: string) => {
		return this.database.films.filter(
			f => f.name.toLowerCase().includes(search.toLowerCase()))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	public async addMonitor(chatId: number, monitor: Monitor) {
		const chat = this.getChat(chatId);
		monitor.id = `v${chat.nextMonitorId++}`;
		monitor.chatId = chatId;
		chat.monitors[monitor.id] = monitor;

		await this.database.updateMonitor(chatId, monitor.id);
		await this.database.updateNextMonitorId(chatId);
	}

	public async deleteMonitor(chatId: number, monitorId: string): Promise<Monitor> {
		const chat = this.getChat(chatId);
		const monitor = chat.monitors[monitorId];
		delete chat.monitors[monitorId];

		await this.database.updateMonitor(chatId, monitorId);
		return monitor;
	}

	public async updateMonitor(chatId: number, monitorId: string, updateFunction?: (monitor: Monitor) => unknown) {
		if (updateFunction)
			await updateFunction(this.getChat(chatId).monitors[monitorId]);
		await this.database.updateMonitor(chatId, monitorId);
	}

	public async updateBotState(chatId: number, botState: BotState) {
		const chat = this.getChat(chatId);
		chat.state = botState;
		await this.database.updateState(chatId);
	}
}