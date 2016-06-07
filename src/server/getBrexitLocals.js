import cheerio from 'cheerio';
import marked from 'marked';
import Promise from 'bluebird';

export default async function getBrexitLocals() {
	const [data, pollCharts] = await Promise.all([
		fetchBerthaData(),

		Promise.props({
			default: fetchChart(300),
			S: fetchChart(400),
			M: fetchChart(289, 100),
			L: fetchChart(409),
			XL: fetchChart(529),
		}),
	]);

	return { ...data, pollCharts };
}

async function fetchChart(width, height = 75) {
	const url = `https://ig.ft.com/sites/brexit-polling/poll-of-polls/fontless/${width}-x-${height}.svg`;
	const res = await Promise.resolve(fetch(url))
		.timeout(10000, new Error(`Timeout - brexit-polling took too long to respond: ${url}`));
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);
	return res.text();
}

function countdown() {
	const oneday = 24 * 60 * 60 * 1000;
	const referendum = new Date(2016, 5, 23);
	const today = new Date();
	return Math.ceil((today.getTime() - referendum.getTime()) / -oneday);
}

export async function fetchBerthaData() {
	const url = `http://bertha.ig.ft.com/view/publish/gss/${process.env.OPTIONS_SHEET_KEY}/options,links`;
	const res = await Promise.resolve(fetch(url))
		.timeout(10000, new Error(`Timeout - bertha took too long to respond: ${url}`));
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);

	const { options, links } = await res.json();

	const data = { links };

	for (const { name, value } of options) {
		if (!name) {
			throw new Error(
				`Malformed content. Found an undefined option name in the spreadsheet: ${url}`
			);
		}

		data[name] = value;
	}

	// const daystogo = countdown();

	// if (daystogo > 0) {
	// 	data.heading = `${data.heading}: ${daystogo} days until the referendum`;
	// }

	// process text from markdown to html, then insert data-trackable attributes into any links
	data.text = (() => {
		const $ = cheerio.load(marked(data.text));
		$('a[href]').attr('data-trackable', 'link');
		return $.html();
	})();

	return data;
}
