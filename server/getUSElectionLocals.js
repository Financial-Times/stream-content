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
	for (const { label, party, total } of results) resultsData.push({ label, party, total });
	
	// sort by total delegates descending
	resultsData.sort( (a, b) => {
		return b.total - a.total;
	});
	
	// get the last name of each candidarte
	resultsData = resultsData.map( candidate => {
		let candidateLastName = candidate.label.split(" ");
		candidateLastName = candidateLastName[candidateLastName.length-1];

		return {
			label: candidateLastName,
			party: candidate.party,
			total: candidate.total
		};
	});

	// split democrats and republicans so we can get the top 2 of each
	const democrats = resultsData.filter( candidate => candidate.party === 'democrats' );
	const republicans = resultsData.filter( candidate => candidate.party === 'republicans' );

	// variables used inside template
	data.democratFirstCandidate = democrats[0].label;
	data.democratFirstCandidateDelegates = democrats[0].total;

	data.democratSecondCandidate = democrats[1].label;
	data.democratSecondCandidateDelegates = democrats[1].total;

	data.republicanFirstCandidate = republicans[0].label;
	data.republicanFirstCandidateDelegates = republicans[0].total;

	data.republicanSecondCandidate = republicans[1].label;
	data.republicanSecondCandidateDelegates = republicans[1].total;

	// process text from markdown to html, then insert data-trackable attributes into any links
	data.text = (() => {
		const $ = cheerio.load(marked(data.text));
		$('a[href]').attr('data-trackable', 'link');
		return $.html();
	})();

	return data;
}
