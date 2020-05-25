import fetch from 'node-fetch'

import { IShowTime, Film } from 'plk-bot/models';
import { formatDate } from 'shared';

export interface IPlkAgent {
	getShowTimes(): Promise<IShowTime[]>;
	getFilms(): Promise<Film[]>;
	onError: (r: any) => void;
}

export class PlkAgent implements IPlkAgent {
	public onError: (r: any) => void;

	constructor(private readonly plkUrlFilms: string, private readonly plkUrlShowTimes: string) { }

	public async getShowTimes(): Promise<IShowTime[]> {
		const datePlus60Days = new Date();
		datePlus60Days.setDate(datePlus60Days.getDate() + 60);

		const url = `${this.plkUrlFilms}&startDate=${formatDate(new Date())}&endDate=${formatDate(datePlus60Days)}`;
		const response = await fetch(url);
		const json = await response.json();
		console.log(`X-Rate-Limit-Limit: ${response.headers.get('X-Rate-Limit-Limit')}`);
		console.log(`X-Rate-Limit-Remaining: ${response.headers.get('X-Rate-Limit-Remaining')}`);
		console.log(`X-Rate-Limit-Reset: ${response.headers.get('X-Rate-Limit-Reset')}`);

		if (!response.ok && this.onError) {
			this.onError(json);
			return [];
		}

		return json.data.showTimes;
	}

	public async getFilms(): Promise<Film[]> {
		const response = await fetch(this.plkUrlShowTimes);
		const json = await response.json();
		console.log(`X-Rate-Limit-Limit: ${response.headers.get('X-Rate-Limit-Limit')}`);
		console.log(`X-Rate-Limit-Remaining: ${response.headers.get('X-Rate-Limit-Remaining')}`);
		console.log(`X-Rate-Limit-Reset: ${response.headers.get('X-Rate-Limit-Reset')}`);

		if (!response.ok && this.onError) {
			this.onError(json);
			return [];
		}

		const theatersM = json.data.theaters[0];
		const theatreMovies = theatersM.theatre_movies.inTheaters.movies.concat(theatersM.theatre_movies.soon.movies);

		return theatreMovies.map(x => <Film>{
			technologies: x.technologies,
			uid: x.uid,
			name: x.name,
			sinceDate: x.sinceDate,
			endDate: x.endDate
		});
	}
}