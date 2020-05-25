import fetch from 'node-fetch';
import { Response } from 'node-fetch';

import { Chat, Film } from 'plk-bot/models';
import { isDefined } from 'shared';

interface DBSchema {
	chats: { [id: number]: Chat };
	applicationOn: boolean;
}

export class PlkRepository implements IPlkRepository {
	public chats: { [id: number]: Chat } = {};
	public films: Film[] = [];
	public applicationOn: boolean = true;

	constructor(private databaseUrl: string) { }

	public async init(): Promise<void> {
		const response = await fetch(`${this.databaseUrl}/.json`);
		const db = (await response.json()) as DBSchema;
		this.applicationOn = db ? db.applicationOn || this.applicationOn : this.applicationOn;
		this.chats = db ? db.chats || this.chats : this.chats;
	}

	private async checkError(response: Response): Promise<void> {
		if (!response.ok)
			throw new Error(JSON.stringify(await response.json()));
	}

	public async updateChat(chatId: number): Promise<void> {
		const body = this.chats[chatId];
		this.checkError(await fetch(`${this.databaseUrl}/chats/${chatId}.json`, {
			method: 'PUT',
			body: JSON.stringify(body)
		}));
	}

	public async updateApplicationOn(): Promise<void> {
		const body = this.applicationOn;
		this.checkError(await fetch(`${this.databaseUrl}/applicationOn.json`, {
			method: 'PUT',
			body: JSON.stringify(body)
		}));
	}

	public async updateNextMonitorId(chatId: number): Promise<void> {
		const body = this.chats[chatId].nextMonitorId;
		this.checkError(await fetch(`${this.databaseUrl}/chats/${chatId}/nextMonitorId.json`, {
			method: 'PUT',
			body: JSON.stringify(body)
		}));
	}

	public async updateMonitor(chatId: number, monitorId: string): Promise<void> {
		const body = this.chats[chatId].monitors[monitorId];

		if (isDefined(body))
			this.checkError(await fetch(`${this.databaseUrl}/chats/${chatId}/monitors/${monitorId}.json`, {
				method: 'PUT',
				body: JSON.stringify(body)
			}));
		else
			this.checkError(await fetch(`${this.databaseUrl}/chats/${chatId}/monitors/${monitorId}.json`, {
				method: 'DELETE'
			}));
	}

	public async updateState(chatId: number): Promise<void> {
		const body = this.chats[chatId].state;
		this.checkError(await fetch(`${this.databaseUrl}/chats/${chatId}/state.json`, {
			method: 'PUT',
			body: JSON.stringify(body)
		}));
	}
}

export interface IPlkRepository {
	films: Film[];
	chats: { [id: number]: Chat };
	applicationOn: boolean;

	init(): Promise<void>;
	updateChat(chatId: number): Promise<void>;
	updateApplicationOn(): Promise<void>;
	updateNextMonitorId(chatId: number): Promise<void>;
	updateMonitor(chatId: number, monitorId: string): Promise<void>;
	updateState(chatId: number): Promise<void>;
}