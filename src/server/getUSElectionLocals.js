import cheerio from 'cheerio';
import marked from 'marked';

export default async function getUSElectionLocals() {
	const contentURL = `http://bertha.ig.ft.com/view/publish/gss/${process.env.US_ELECTION_SPREADSHEET_KEY}/options,links`;
	const resultsURL = `http://bertha.ig.ft.com/view/publish/gss/${process.env.US_ELECTION_RESULTS_SPREADSHEET_KEY}/results`;

	const [contentRes, resultsRes] = await Promise.all([fetch(contentURL), fetch(resultsURL)]);

	if (!contentRes.ok) throw new Error(`Request failed with ${contentRes.status}: ${contentURL}`);
	if (!resultsRes.ok) throw new Error(`Request failed with ${resultsRes.status}: ${resultsURL}`);

	const contentSheets = await contentRes.json();
	const results = await resultsRes.json();

	const { options } = contentSheets;

	const data = {};
	let resultsData = [];

	for (const { name, value } of options) data[name] = value;

	for (const { label, party, value, superdelegates, total, droppedout } of results) {
		resultsData.push({ label, party, value, superdelegates, total, droppedout });
	}

	// sort by total delegates descending
	resultsData.sort((a, b) => b.total - a.total);

	// only use the last name for each candidate
	resultsData = resultsData.map(candidate => {
		candidate.label = candidate.label.split(" ");
		candidate.label = candidate.label[candidate.label.length - 1];

		return candidate;
	});

	// split democrats and republicans so we can get the top candidates from each party
	const democrats = resultsData.filter(candidate =>
		!candidate.droppedout && candidate.party === 'democrats'
	);
	const republicans = resultsData.filter(candidate =>
		!candidate.droppedout && candidate.party === 'republicans'
	);

	// variables used inside template
	data.democrats = democrats;
	data.democrat100Percent = data.democratTotalToWin;

	if (democrats[0].total > data.democratTotalToWin) {
		data.democrat100Percent = democrats[0].total;
	}

	// variables used inside template
	data.republicans = republicans;
	data.republican100Percent = data.republicanTotalToWin;

	if (republicans[0].total > data.republicanTotalToWin) {
		data.republican100Percent = republicans[0].total;
	}

	// process text from markdown to html, then insert data-trackable attributes into any links
	data.text = (() => {
		const $ = cheerio.load(marked(data.text));
		$('a[href]').attr('data-trackable', 'link');
		return $.html();
	})();

	if (data.secondaryText) {
		data.secondaryText = (() => {
			const $ = cheerio.load(marked(data.secondaryText));
			$('a[href]').attr('data-trackable', 'link');
			return $.html();
		})();
	}

	data.isBrightcove = typeof data.video === 'number';
	data.isYoutube = !data.isBrightcove;

	return data;
}
