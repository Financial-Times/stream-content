import cheerio from 'cheerio';
import marked from 'marked';

export default async function getUSElectionLocals() {
	const url = `http://bertha.ig.ft.com/view/publish/gss/${process.env.US_ELECTION_SPREADSHEET_KEY}/options,links`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);

	const sheets = await res.json();

	const { options } = sheets;

	const data = {};

	for (const { name, value } of options) data[name] = value;

	// process text from markdown to html, then insert data-trackable attributes into any links
	data.text = (() => {
		const $ = cheerio.load(marked(data.text));
		$('a[href]').attr('data-trackable', 'link');
		return $.html();
	})();

	return data;
}
