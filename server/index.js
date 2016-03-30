/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import getLocals, { fetchBerthaData } from './getLocals';
import jade from 'jade';
import Koa from 'koa';
import path from 'path';
import Router from 'koa-router';

const PORT = process.env.PORT || 5000;

const app = new Koa();
const router = new Router();

// precompile template functions
const views = path.resolve(__dirname, '..', 'views');

const renderBrexitCard = jade.compileFile(path.join(views, 'brexit/card.jade'));
const renderBrexitSummary = jade.compileFile(path.join(views, 'brexit/summary.jade'));
const renderBrexitGuide = jade.compileFile(path.join(views, 'brexit/guide.jade'));
const renderBrexitIframe = jade.compileFile(path.join(views, 'brexit/iframe.jade'));
const renderBrexitPreview = jade.compileFile(path.join(views, 'brexit/preview.jade'));

const renderUsElection2016Summary = jade.compileFile(path.join(views, 'us-election-2016/summary.jade'));
const renderUsElection2016Preview = jade.compileFile(path.join(views, 'us-election-2016/preview.jade'));

const elements = {
	'brexit-summary': async ctx => {

		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitSummary(await getLocals()) });
	},
	'brexit-guide': async ctx => {

		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitGuide(await getLocals()) });
	},
	'us-election-2016-summary': async ctx => {

		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderUsElection2016Summary() });
	}
};

// define routes
router
	// a route to get the bertha data (post-transformations)
	.get('/metacard/data.json', async ctx => {

		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify(await fetchBerthaData());
	})

	.get('/elements/:name.json', async ctx => {

		if (elements[ctx.params.name]) {
			await elements[ctx.params.name](ctx);
		}
	})

	// fragment (for inlining in Next stream page)
	.get('/metacard/fragment.json', async ctx => {

		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitCard(await getLocals()) });
	})

	// topic summary fragment
	.get('/metacard/fragment-topic-summary.json', async ctx => {

		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitSummary(await getLocals()) });
	})

	// topic guide fragment
	.get('/metacard/fragment-topic-guide.json', async ctx => {

		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitGuide(await getLocals()) });
	})

	// iframe (for using on the Falcon brexit page)
	.get('/metacard/iframe.html', async ctx => {
		ctx.set('Cache-Control', 'max-age=500');

		try {
			ctx.body = renderBrexitIframe(await getLocals());
		}
		catch (error) {
			console.error('ERROR!', error ? error.stack : error);

			ctx.status = 500;
			ctx.body = `<script>frameElement.height=0;frameElement.style='display:none'</script>`;
			return;
		}
	})

	// preview (for dev only)
	.get('/metacard/preview.html', async ctx => {
		ctx.body = renderBrexitPreview(await getLocals());
	})

	// preview (for dev only)
	.get('/us-election-2016/preview.html', async ctx => {
		ctx.body = renderUsElection2016Preview();
	})

	// redirect from root
	.redirect('/', '/us-election-2016/preview.html', 302)
;

// start it up
app
	.use(router.routes())
	.use(router.allowedMethods())
	.listen(PORT, () => {
		console.log('Running on port', PORT);
	})
;
