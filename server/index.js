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
const renderCardTop = jade.compileFile(path.join(views, 'card-top.jade'));
const renderCardBottom = jade.compileFile(path.join(views, 'card-bottom.jade'));
const renderCard = jade.compileFile(path.join(views, 'card.jade'));
const renderIframe = jade.compileFile(path.join(views, 'iframe.jade'));
const renderPreview = jade.compileFile(path.join(views, 'preview.jade'));

// define routes
router
	// a route to get the bertha data (post-transformations)
	.get('/metacard/data.json', async function getFragment(ctx) {
		ctx.set('Content-Type', 'application/json');

		ctx.body = JSON.stringify(await fetchBerthaData());
	})

	// fragment (for inlining in Next stream page)
	.get('/metacard/fragment.json', async function getFragment(ctx) {
		ctx.set('Content-Type', 'application/json');

		ctx.body = JSON.stringify({ fragment: renderCard(await getLocals()) });
	})

	// top fragment
	.get('/metacard/fragment-top.json', async function getFragment(ctx) {
		ctx.set('Content-Type', 'application/json');
		
		ctx.body = JSON.stringify({ fragment: renderCardTop(await getLocals()) });
	})

	// bottom fragment
	.get('/metacard/fragment-bottom.json', async function getFragment(ctx) {
		ctx.set('Content-Type', 'application/json');

		ctx.body = JSON.stringify({ fragment: renderCardBottom(await getLocals()) });
	})

	// iframe (for using on the Falcon brexit page)
	.get('/metacard/iframe.html', async function getIframe(ctx) {
		ctx.set('Cache-Control', 'max-age=500');

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
