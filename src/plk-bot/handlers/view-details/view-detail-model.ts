import { emptyStringIfNotDefined } from 'shared';

export class ViewDetailCallback {
	monitorId: string;
	technologyIndex: number;
	datePage: number;
	dateIndex: number;
	state: ViewDetailState;

	public static createFromString(val: string): ViewDetailCallback {
		const callback = new ViewDetailCallback();
		const info = val.split(':');
		callback.monitorId = info[0];
		callback.technologyIndex = info[1] !== '' ? +info[1] : undefined;
		callback.datePage = info[2] !== '' ? +info[2] : 0;
		callback.dateIndex = info[3] !== '' ? +info[3] : undefined;
		callback.state = info[4] as ViewDetailState || ViewDetailState.ChooseTechnology;
		return callback;
	}
	public static createFromId(monitorId: string): ViewDetailCallback {
		const callback = new ViewDetailCallback();

		callback.monitorId = monitorId;
		callback.state = ViewDetailState.ChooseTechnology;
		return callback;
	}

	public toString = (): string => {
		const monitorId = emptyStringIfNotDefined(this.monitorId);
		const technologyIndex = emptyStringIfNotDefined(this.technologyIndex);
		const datePage = emptyStringIfNotDefined(this.datePage);
		const dateIndex = emptyStringIfNotDefined(this.dateIndex);
		const state = emptyStringIfNotDefined(this.state);
		return `${monitorId}:${technologyIndex}:${datePage}:${dateIndex}:${state}`;
	}
}

export enum ViewDetailState {
	ChooseTechnology = 'ct',
	ChooseDate = 'cd',
	ViewDateTimes = 'vd',
	CreatePoll = 'cp'
}