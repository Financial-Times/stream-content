process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV === 'development') {
	require('dotenv').config()
}

/* global fetch */
require('isomorphic-fetch');

const getSummaryLocals = require('./getSummaryLocals');
const jade = require('jade');
const Koa = require('koa');
const koaLogger = require('koa-logger');
const koaStatic = require('koa-static');
const path = require('path');
const Router = require('koa-router');

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', error => {
	console.log('Global uncaughtException!', error.stack);
	console.dir(error);
	process.exit(1);
});

process.on('unhandledRejection', error => {
	console.log('Global uncaughtException!', error.stack);
	console.dir(error);
	process.exit(1);
});

const app = new Koa();
const router = new Router();

const renderSummaryCard = jade.compileFile(
	path.join(__dirname, 'views/summary-card/summary.jade')
);
const renderSummaryCardPreview = jade.compileFile(
	path.join(__dirname, 'views/summary-card/preview.jade')
);

async function summaryCard(name, ctx) {
	ctx.set('Content-Type', 'application/json');

	const card = await getSummaryLocals(name);

	if (!card) {
		ctx.status = 404;
		ctx.body = {
			fragment: '',
			message: 'Not Found',
		};
		return;
	}

	ctx.body = JSON.stringify({
		fragment: renderSummaryCard(card)
	});
}

// define routes
router
	.get('/elements/:name.json', async ctx => {
		if (ctx.params.name.startsWith('summary-')) {
			await summaryCard(
				ctx.params.name.replace(/^summary\-/, ''),
				ctx
			);
		}
	})

	.get('/elements-preview/:name', async ctx => {
		if (ctx.params.name.startsWith('summary-')) {
			ctx.body = renderSummaryCardPreview(
				await getSummaryLocals(ctx.params.name.replace(/^summary\-/, ''))
			);
		}
	})
;

// log in development
if (process.env.NODE_ENV === 'development') {
	app.use(koaLogger());
}

// start it up
app
	.use(router.routes())
	.use(router.allowedMethods())
	.use(koaStatic(path.resolve(__dirname, '..', 'client')))
	.listen(PORT, () => {
		console.log(`\nRunning on port ${PORT} - http://localhost:${PORT}/`);
	})
;
