/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import jade from 'jade';
import Koa from 'koa';
import marked from 'marked';
import path from 'path';
import Promise from 'bluebird';
import Router from 'koa-router';

const PORT = process.env.PORT || 5000;

const app = new Koa();
const router = new Router();

// precompile template functions
const views = path.resolve(__dirname, '..', 'views');
const renderCard = jade.compileFile(path.join(views, 'card.jade'));
const renderIframe = jade.compileFile(path.join(views, 'iframe.jade'));
const renderPreview = jade.compileFile(path.join(views, 'preview.jade'));


// function to load various resources and assemble template data
async function getLocals() {
	const [options, pollCharts] = await Promise.all([
		fetchOptions(),
		Promise.props({
			default: fetchChart(300),
			S: fetchChart(400),
			M: fetchChart(289),
			L: fetchChart(409),
			XL: fetchChart(529),
		}),
	]);

	return { ...options, pollCharts };
}

async function fetchChart(width, height = 75) {
	const url = `https://ig.ft.com/sites/brexit-polling/poll-of-polls/${width}-x-${height}.svg`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);
	return res.text();
}

async function fetchOptions() {
	const url = `http://bertha.ig.ft.com/view/publish/gss/${process.env.OPTIONS_SHEET_KEY}/options`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);

	const rows = await res.json();
	const options = {};
	for (const {name, value} of rows) options[name] = value;

	// process text with markdown
	options.text = marked(options.text);

	return options;
}

// define routes
router
	// fragment (for inlining in Next stream page)
	.get('/metacard/fragment.json', async function getFragment(ctx) {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderCard(await getLocals()) });
	})

	// iframe (for using on the Falcon brexit page)
	.get('/metacard/iframe.html', async function getIframe(ctx) {
		ctx.body = renderIframe(await getLocals());
	})

	// preview (for dev only)
	.get('/metacard/preview.html', async function getPreview(ctx) {
		ctx.body = renderPreview(await getLocals());
	})

	// redirect from root
	.redirect('/', '/metacard/preview.html', 302)
;

// start it up
app
	.use(router.routes())
	.use(router.allowedMethods())
	.listen(PORT, () => {
		console.log('Running on port', PORT);
	})
;
