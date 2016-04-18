import cheerio from 'cheerio';
import marked from 'marked';

export default async function getUSElectionLocals() {
	const contentURL = `http://bertha.ig.ft.com/view/publish/gss/${process.env.US_ELECTION_SPREADSHEET_KEY}/options,links`;
	const resultsURL = `http://bertha.ig.ft.com/view/publish/gss/${process.env.US_ELECTION_RESULTS_SPREADSHEET_KEY}/results,options`;

	const [contentRes, resultsRes] = await Promise.all([fetch(contentURL), fetch(resultsURL)]);

	if (!contentRes.ok) throw new Error(`Request failed with ${contentRes.status}: ${contentURL}`);
	if (!resultsRes.ok) throw new Error(`Request failed with ${resultsRes.status}: ${resultsURL}`);

	const data = {};

	const { options } = await contentRes.json();
	for (const { name, value } of options) {
		if(!name) throw new Error(`Malformed content. Found an undefined option label in the spreadsheet: ${contentURL}`);
		data[name] = value;
	}

	const allResultsSheets = await resultsRes.json();

	// build a convenient options lookup
	const resultsOptions = {};
	for (const { name, value } of allResultsSheets.options) {
		if(!name) throw new Error(`Malformed content. Found an undefined option label in the spreadsheet: ${resultsURL}`);
		resultsOptions[name] = value;
	}

	// sort results by total delegates descending
	let results = allResultsSheets.results;
	results.sort((a, b) => b.total - a.total);

	// only use the last name for each candidate
	results = results.map(candidate => {
		candidate.label = candidate.label.split(' ');
		candidate.label = candidate.label[candidate.label.length - 1];

		return candidate;
	});

	data.democratTotalToWin = resultsOptions.demdelegatestotal;
	data.republicanTotalToWin = resultsOptions.repdelegatestotal;

	// split democrats and republicans so we can get the top candidates from each party
	const democrats = results.filter(candidate =>
		!candidate.droppedout && candidate.party === 'democrats'
	);
	const republicans = results.filter(candidate =>
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
