import { Film, Monitor } from 'plk-bot/models';
import { isDefined, emptyStringIfNotDefined, formatDate } from 'shared';

export class MonitorCallback {
	searchedFilm: string;
	page: number;
	index: number;
	chosenFilm: Film;
	chosenTechnology: string;
	year: number;
	month: number;
	day: number;
	withoutDate: boolean;
	state: BuildCallbackState;

	get formattedDate(): string {
		return formatDate(new Date(Date.UTC(this.year, this.month - 1, this.day)));
	}

	public static Create(str: string): MonitorCallback {
		const monitor = new MonitorCallback();
		monitor.searchedFilm = str;
		monitor.page = 0;
		monitor.index = undefined;
		monitor.chosenFilm = undefined;
		monitor.chosenTechnology = undefined;
		monitor.year = undefined;
		monitor.month = undefined;
		monitor.day = undefined;
		monitor.withoutDate = undefined;
		monitor.state = BuildCallbackState.ChooseFilm;
		return monitor;
	}

	public static CreateFromString(str: string, searchFilms: (search: string) => Film[]) {
		const monitor = new MonitorCallback();
		const info = str.split(':');
		monitor.searchedFilm = info[0];
		monitor.page = !!info[1] ? +info[1] : undefined;
		monitor.index = !!info[2] ? +info[2] : undefined;
		monitor.chosenFilm = isDefined(monitor.index) ? searchFilms(monitor.searchedFilm)[monitor.index] : null;
		monitor.chosenTechnology = info[3];
		monitor.year = !!info[4] ? +info[4] : undefined;
		monitor.month = !!info[5] ? +info[5] : undefined;
		monitor.day = !!info[6] ? +info[6] : undefined;
		monitor.withoutDate = isDefined(info[7]) ? (info[7] === 'y' ? true : (info[7] === 'n' ? false : undefined)) : undefined;
		monitor.state = info[8] as BuildCallbackState || BuildCallbackState.ChooseFilm;

		return monitor;
	}

	public toString(): string {
		const sf = this.searchedFilm;
		const page = this.page;
		const index = emptyStringIfNotDefined(this.index);
		const cT = emptyStringIfNotDefined(this.chosenTechnology)
		const year = emptyStringIfNotDefined(this.year)
		const day = emptyStringIfNotDefined(this.day)
		const month = emptyStringIfNotDefined(this.month)
		const withoutDate = isDefined(this.withoutDate) ? (this.withoutDate ? 'y' : 'n') : '';
		const state = emptyStringIfNotDefined(this.state);
		return `${sf}:${page}:${index}:${cT}:${year}:${month}:${day}:${withoutDate}:${state}`;
	}

	public toMonitor(): Monitor {
		const monitor = new Monitor();
		monitor.film = this.chosenFilm;
		monitor.technology = this.chosenTechnology;

		if (!this.withoutDate) {
			monitor.date = this.formattedDate;
		} else {
			monitor.date = 'any';
		}

		monitor.prepare = false;
		return monitor;
	}
}

export enum BuildCallbackState {
	ChooseFilm = 'cf',
	ChooseTechnology = 'ct',
	SpecifyDateOrNot = 'sd',
	ChooseYear = 'cy',
	ChooseMonth = 'cm',
	ChooseDate = 'cd',
	Confirm = 'cc',
	Create = 'cr',
}