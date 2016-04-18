import cheerio from 'cheerio';
import marked from 'marked';
import Promise from 'bluebird';

export default async function getBrexitLocals() {
	const [data, pollCharts] = await Promise.all([
		fetchBerthaData(),
		Promise.props({
			default: fetchChart(300),
			S: fetchChart(400),
			M: fetchChart(289),
			L: fetchChart(409),
			XL: fetchChart(529),
		}),
	]);

	return { ...data, pollCharts };
}

async function fetchChart(width, height = 75) {
	const url = `https://ig.ft.com/sites/brexit-polling/poll-of-polls/fontless/${width}-x-${height}.svg`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);
	return res.text();
}

export async function fetchBerthaData() {
	const url = `http://bertha.ig.ft.com/view/publish/gss/${process.env.OPTIONS_SHEET_KEY}/options,links`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);

	const { options, links } = await res.json();

	const data = { links };

	for (const { name, value } of options) {
		if(!name) throw new Error(`Malformed content. Found an undefined option label in the spreadsheet: ${url}`);
		data[name] = value;
	}

	// process text from markdown to html, then insert data-trackable attributes into any links
	data.text = (() => {
		const $ = cheerio.load(marked(data.text));
		$('a[href]').attr('data-trackable', 'link');
		return $.html();
	})();

	return data;
}
