import { absolutePath } from './absolutePath';
absolutePath();

import fetch from 'node-fetch'
import { createServer, IncomingMessage, ServerResponse } from 'http';

import { initErchBot } from 'erch-bot';
import { initOffersBot } from 'offers-bot';
import { initPlkBot } from 'plk-bot';
import { initRiddleBot } from 'riddle-bot';
import { setIntervalByMinutes } from 'shared';
import { TelegrafRequestListener } from 'helpers/telegrafHelper';

type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

const isApplicationInMaintenance = process.env.MAINTENANCE === 'true' ? true : false;

if (!isApplicationInMaintenance) {
	console.log('Application will start');
	startServer();
} else {
	console.log('Application will not start');
}

async function startServer() {
	const hostUrl = process.env.HOST_URL;
	const port = +process.env.PORT || 9999;
	const debugMode = process.env.DEBUG === 'false' ? false : true;

	if (!debugMode) {
		setIntervalByMinutes(() => fetch(hostUrl), 15);
	}

	const requestListeners = await Promise.all([
		initPlkBot(hostUrl, debugMode),
		initErchBot(hostUrl, debugMode),
		initRiddleBot(hostUrl, debugMode),
		initOffersBot(hostUrl, debugMode)
	]);
	const requestListener = combineTelegrafListenerToRequestListener(requestListeners);

	return createServer(requestListener)
		.listen(port, null, () => console.log(`Server listening on port: ${port}`));
}

function combineTelegrafListenerToRequestListener(requestListeners: TelegrafRequestListener[]): RequestListener {
	const notFoundListener: RequestListener = (_, res) => {
		res.statusCode = 404;
		res.write('Not found');
		return res.end();
	};

	return requestListeners
		.filter(listener => listener)
		.reduce<RequestListener>(
			(prev, current) =>
				(req, res) => current(req, res, () => prev(req, res)),
			notFoundListener);
}