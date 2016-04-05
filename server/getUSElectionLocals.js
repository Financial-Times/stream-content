import cheerio from 'cheerio';
import marked from 'marked';

export default async function getUSElectionLocals() {
	const url = `http://bertha.ig.ft.com/view/publish/gss/${process.env.US_ELECTION_SPREADSHEET_KEY}/options,results,links`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);

	const sheets = await res.json();

	const { options, results } = sheets;

	const data = {};
	for (const { name, value } of options) data[name] = value;


	let resultsData = [];
	for (const { label, party, value, superdelegates, total, droppedout } of results) resultsData.push({ label, party, value, superdelegates, total, droppedout });
	
	// sort by total delegates descending
	resultsData.sort( (a, b) => {
		return b.total - a.total;
	});
	
	// only use the last name for each candidate
	resultsData = resultsData.map( candidate => {
		candidate.label = candidate.label.split(" ");
		candidate.label = candidate.label[candidate.label.length-1];

		return candidate;
	});

	// split democrats and republicans so we can get the top 2 of each
	const democrats = resultsData.filter( candidate => {
		return !candidate.droppedout && candidate.party === 'democrats'
	});
	const republicans = resultsData.filter( candidate => {
		return !candidate.droppedout && candidate.party === 'republicans'
	});

	// variables used inside template
	data.democratFirstCandidate = democrats[0].label;
	data.democratFirstCandidatePledgedDelegates = democrats[0].value;
	data.democratFirstCandidateSuperdelegates = democrats[0].superdelegates;
	data.democratFirstCandidateDelegates = democrats[0].total;

	data.democratSecondCandidate = democrats[1].label;
	data.democratSecondCandidatePledgedDelegates = democrats[1].value;
	data.democratSecondCandidateSuperdelegates = democrats[1].superdelegates;
	data.democratSecondCandidateDelegates = democrats[1].total;

	data.republicanFirstCandidate = republicans[0].label;
	data.republicanFirstCandidateDelegates = republicans[0].total;

	data.republicanSecondCandidate = republicans[1].label;
	data.republicanSecondCandidateDelegates = republicans[1].total;

	data.republicanThirdCandidate = republicans[2].label;
	data.republicanThirdCandidateDelegates = republicans[2].total;

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
