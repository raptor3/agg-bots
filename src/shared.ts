export function isDefined(variable: any): boolean {
	return !(typeof variable === 'undefined' || variable === null);
}

export function emptyStringIfNotDefined(variable: any): any {
	return !isDefined(variable) ? '' : variable;
}

export function formatDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function setIntervalByMinutes(func, minutes) {
	setInterval(func, 1000 * 60 * minutes);
}

type Dictionary<T> = { [key in string]: T } | { [key in number]: T }

export function forEach<T>(dict: Dictionary<T>, func: (value: T, key?: string) => unknown) {
	keys(dict).forEach(k => func(dict[k], k));
}

export function map<T, R>(dict: Dictionary<T>, func: (value: T, key?: string) => R): R[] {
	return keys(dict).map(k => func(dict[k], k));
}

export function values<T>(dict: Dictionary<T>): T[] {
	return map(dict, v => v);
}

export function keys(obj: any): string[] {
	return Object.keys(obj);
}

export function unique<T>(objects: T[]) {
	return [...new Set(objects)];
}