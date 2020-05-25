import { InlineKeyboardButton } from 'telegraf/typings/telegram-types';

export function createInlineKey(text: string, callback: string): InlineKeyboardButton {
	return {
		text: text,
		callback_data: callback
	} as InlineKeyboardButton;
}

export function paginationV2<T>(elements: T[], onPageCount: number, pageNumber: number,
	messageFunc: (elements: T[], startIndex: number) => string,
	keyboardButtonsFunc: (elements: T[], startIndex: number) => InlineKeyboardButton[],
	pageNumberToCallBack: (pageNumber: number) => string): { message: string, keyboard: InlineKeyboardButton[][] } {

	const startIndex = onPageCount * pageNumber;
	const filteredElements = elements.slice(startIndex, startIndex + onPageCount);

	const message = messageFunc(filteredElements, startIndex);
	const keyboard = keyboardButtonsFunc(filteredElements, startIndex).map(x => [x]) || [];

	if (elements.length > onPageCount)
		keyboard.push(pagination(pageNumber + 1, elements.length, onPageCount, pageNumberToCallBack));
	return {
		message,
		keyboard
	};
}

export function pagination(currentPage: number, elementsCount: number, elementsOnPage: number, pageNumberToCallBack: (pageNumber: number) => string): InlineKeyboardButton[] {
	let keyboard: InlineKeyboardButton[] = [];

	let lastPageNumber = elementsCount / elementsOnPage;
	lastPageNumber = Number.isInteger(lastPageNumber) ? lastPageNumber : Math.floor(lastPageNumber) + 1;

	if (lastPageNumber <= 5) {
		for (let i = 1; i <= lastPageNumber; i++)
			keyboard.push(getKeyForPage(i, currentPage, lastPageNumber, pageNumberToCallBack(i)));
		return keyboard;
	}

	let pages: number[];
	if (currentPage === 1 || currentPage === 2) {
		pages = [1, 2, 3, 4, lastPageNumber];
	} else if (currentPage === lastPageNumber || currentPage === lastPageNumber - 1) {
		pages = [1, lastPageNumber - 3, lastPageNumber - 2, lastPageNumber - 1, lastPageNumber];
	} else {
		pages = [1, currentPage - 1, currentPage, currentPage + 1, lastPageNumber];
	}

	return pages.map(x => getKeyForPage(x, currentPage, lastPageNumber, pageNumberToCallBack(x)));
}

function getKeyForPage(pageNumber: number, currentPageNumber: number, lastPageNumber: number, callbackData: string): InlineKeyboardButton {
	let text: string;
	if (pageNumber === currentPageNumber) {
		text = `-${pageNumber}-`;
	} else if (pageNumber === 1 && pageNumber < currentPageNumber - 2) {
		text = `<<${pageNumber}`;
	} else if (pageNumber === lastPageNumber && pageNumber > currentPageNumber + 2) {
		text = `${pageNumber}>>`;
	} else if (currentPageNumber - 3 < 1 && pageNumber <= 3) {
		text = `${pageNumber}`;
	} else if (currentPageNumber + 3 > lastPageNumber && pageNumber >= lastPageNumber - 2) {
		text = `${pageNumber}`;
	} else if (pageNumber > currentPageNumber) {
		text = `${pageNumber}>`;
	} else if (pageNumber < currentPageNumber) {
		text = `<${pageNumber}`;
	} else {
		text = `${pageNumber}`;
	}
	return createInlineKey(text, callbackData);
}

export function addBackButton(keyboard: InlineKeyboardButton[][], callbackData: string) {
	keyboard.push([createInlineKey(`Back`, callbackData)]);
}
