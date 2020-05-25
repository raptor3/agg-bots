import { emptyStringIfNotDefined } from 'shared';

export class DeleteMonitorCallback {
	page: number;
	id: string;
	state: DeleteMonitorState;

	public constructor(val?: string) {
		if (!val) {
			this.page = 0;
			this.id = undefined;
			this.state = DeleteMonitorState.ChooseToDelete;
		} else {
			const info = val.split(':');
			this.page = !!info[0] ? +info[0] : undefined;
			this.id = !!info[1] ? info[1] : undefined;
			this.state = info[2] as DeleteMonitorState || DeleteMonitorState.ChooseToDelete;
		}
	}

	public toString = (): string => {
		const page = this.page;
		const index = emptyStringIfNotDefined(this.id);
		const status = emptyStringIfNotDefined(this.state);
		return `${page}:${index}:${status}`;
	}
}

export enum DeleteMonitorState {
	ChooseToDelete = 'c',
	Confirm = 'co',
	Delete = 'd'
}

export enum DeleteAllMonitorState {
	Confirm = 'co',
	Delete = 'd',
	Cancel = 'ca'
}