export enum BotState {
	None = 'None',
	Created = 'Created',
	CreateMonitoring = 'CreateMonitoring',
	SearchResults = 'search-results',
	SearchTechnology = 'search-technology',
	SearchDate = 'search-date',
}

export enum Commands {
	Start = 'start',
	CreateMonitor = 'createmonitor',
	DeleteMonitor = 'deletemonitors',
	DeleteOutdatedMonitors = 'deleteoutdatedmonitors',
	ViewMonitors = 'viewmonitors',
	On = 'on',
	Off = 'off'
}

export enum CallBackQueries {
	DeleteMonitor = 'd',
	DeleteAllMonitor = 'da',
	CreateMonitor = 'c',
	ViewMonitor = 'v',
	ViewDetail = 'vd'
}

export class Monitor {
	id: string;
	film: Film;
	date: string;
	technology: string;
	prepare: boolean;
	alreadySend: boolean;
	chatId: number;
	detail: DetailTechnology[];

	public static isOutdated(monitor: Monitor): boolean {
		const dateTime = new Date().getTime();
		const day = 24 * 60 * 60 * 1000;

		if (monitor.date && monitor.date !== 'any') {
			return dateTime > new Date(monitor.date).getTime() + day;
		}

		return dateTime > new Date(monitor.film.endDate).getTime() + day;
	}

	public static toString(monitor: Monitor) {
		return `${this.isOutdated(monitor) ? '(Outdated) ' : ''}${monitor.film.name}. Technology: ${monitor.technology}. Date: ${monitor.date}`
	}
}

export class DetailTechnology {
	constructor(technologyId: string, detail: DetailDate[]) {
		this.technologyId = technologyId;
		this.detail = detail;
	}

	technologyId: string;
	detail: DetailDate[];
}

export class DetailDate {
	constructor(date: string, times: string[]) {
		this.date = date;
		this.times = times;
	}

	date: string;
	times: string[];
}

export class Film {
	endDate: string;
	sinceDate: string;
	technologies: Technology[];
	name: string;
	uid: string;
}

export class Technology {
	id: string;
	name: string;
}

export class Chat {
	nextMonitorId: number;
	state: BotState;
	monitors: { [id: string]: Monitor };
}

export interface IShowTime {
	movieId: string;
	technologyId: string;
	date: string;
	timeBegin: string;
	website: {
		hidden: string;
	}
}
