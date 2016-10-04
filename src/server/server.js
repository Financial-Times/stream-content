process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV === 'development') {
	require('dotenv/config');
}

/* global fetch */
import 'isomorphic-fetch';

import getBrexitLocals, { fetchBerthaData } from './getBrexitLocals';
import getUSElectionLocals from './getUSElectionLocals';
import getSummaryLocals from './getSummaryLocals';
import jade from 'jade';
import Koa from 'koa';
import koaLogger from 'koa-logger';
import koaStatic from 'koa-static';
import path from 'path';
import Router from 'koa-router';

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

// precompile template functions
const views = path.resolve(__dirname, 'views');

const renderAIRoboticsSummary = jade.compileFile(path.join(views, 'ai-robotics/summary-card.jade'));
const renderAIRoboticsPreview = jade.compileFile(path.join(views, 'ai-robotics/preview.jade'));

const renderBrexitSummary = jade.compileFile(path.join(views, 'brexit/summary-card.jade'));
const renderBrexitGuide = jade.compileFile(path.join(views, 'brexit/guide.jade'));
const renderBrexitPreview = jade.compileFile(path.join(views, 'brexit/preview.jade'));

const renderSummaryCard = jade.compileFile(
	path.join(views, 'summary-card/summary.jade')
);
const renderSummaryCardPreview = jade.compileFile(
	path.join(views, 'summary-card/preview.jade')
);

const renderUsElection2016Summary = jade.compileFile(
	path.join(views, 'us-election-2016/summary-card.jade')
);
const renderUsElection2016Preview = jade.compileFile(
	path.join(views, 'us-election-2016/preview.jade')
);

const elements = {
	'ai-robotics-summary': async ctx => {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderAIRoboticsSummary() });
	},
	'brexit-summary': async ctx => {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitSummary(await getBrexitLocals()) });
	},
	'brexit-guide': async ctx => {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitGuide(await getBrexitLocals()) });
	},
	'us-election-2016-summary': async ctx => {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({
			fragment: renderUsElection2016Summary(await getUSElectionLocals()),
		});
	},
};

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
	// a route to get the bertha data (post-transformations)
	.get('/metacard/data.json', async ctx => {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify(await fetchBerthaData());
	})

	.get('/elements/:name.json', async ctx => {
		if (elements[ctx.params.name]) {
			await elements[ctx.params.name](ctx);
		} else if (ctx.params.name.startsWith('summary-')) {
			await summaryCard(
				ctx.params.name.replace(/^summary\-/, ''),
				ctx
			);
		}
	})

	.get('/elements-preview/:name', async ctx => {
		if (elements[ctx.params.name]) {
			//await elements[ctx.params.name](ctx);
		} else if (ctx.params.name.startsWith('summary-')) {
			ctx.body = renderSummaryCardPreview(
				await getSummaryLocals(ctx.params.name.replace(/^summary\-/, ''))
			);
		}
	})

	// topic summary fragment
	.get('/metacard/fragment-topic-summary.json', async ctx => {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitSummary(await getBrexitLocals()) });
	})

	// topic guide fragment
	.get('/metacard/fragment-topic-guide.json', async ctx => {
		ctx.set('Content-Type', 'application/json');
		ctx.body = JSON.stringify({ fragment: renderBrexitGuide(await getBrexitLocals()) });
	})

	// preview (for dev only)
	.get('/metacard/preview.html', async ctx => {
		ctx.body = renderBrexitPreview(await getBrexitLocals());
	})

	// preview (for dev only)
	.get('/ai-robotics/preview.html', async ctx => {
		ctx.body = renderAIRoboticsPreview();
	})

	// preview (for dev only)
	.get('/brexit/preview.html', async ctx => {
		ctx.body = renderBrexitPreview(await getBrexitLocals());
	})

	// preview (for dev only)
	.get('/us-election-2016/preview.html', async ctx => {
		ctx.body = renderUsElection2016Preview(await getUSElectionLocals());
	})

	// redirect from root
	.redirect('/', '/ai-robotics/preview.html', 302)
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
