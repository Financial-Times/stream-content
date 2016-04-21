/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import getBrexitLocals, { fetchBerthaData } from './getBrexitLocals';
import getUSElectionLocals from './getUSElectionLocals';
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
const renderAIRoboticsIframe = jade.compileFile(path.join(views, 'ai-robotics/iframe.jade'));
const renderAIRoboticsPreview = jade.compileFile(path.join(views, 'ai-robotics/preview.jade'));

const renderBrexitSummary = jade.compileFile(path.join(views, 'brexit/summary-card.jade'));
const renderBrexitGuide = jade.compileFile(path.join(views, 'brexit/guide.jade'));
const renderBrexitIframe = jade.compileFile(path.join(views, 'brexit/iframe.jade'));
const renderBrexitPreview = jade.compileFile(path.join(views, 'brexit/preview.jade'));

const renderUsElection2016Summary = jade.compileFile(
	path.join(views, 'us-election-2016/summary-card.jade')
);
const renderUsElectionIframe = jade.compileFile(
	path.join(views, 'us-election-2016/iframe.jade')
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

	// iframe (for using on the Falcon brexit page)
	.get('/ai-robotics/iframe.html', async ctx => {
		ctx.set('Cache-Control', 'max-age=500');

		try {
			ctx.body = renderAIRoboticsIframe();
		}
		catch (error) {
			console.error('ERROR!', error ? error.stack : error);

			ctx.status = 500;
			ctx.body = '<script>frameElement.height=0;frameElement.style=\'display:none\'</script>';
			return;
		}
	})

	// iframe (for using on the Falcon brexit page)
	.get('/brexit/iframe.html', async ctx => {
		ctx.set('Cache-Control', 'max-age=500');

		try {
			ctx.body = renderBrexitIframe(await getBrexitLocals());
		}
		catch (error) {
			console.error('ERROR!', error ? error.stack : error);

			ctx.status = 500;
			ctx.body = '<script>frameElement.height=0;frameElement.style=\'display:none\'</script>';
			return;
		}
	})

	// iframe (for using on the Falcon brexit page)
	.get('/metacard/iframe.html', async ctx => {
		ctx.set('Cache-Control', 'max-age=500');

		try {
			ctx.body = renderBrexitIframe(await getBrexitLocals());
		}
		catch (error) {
			console.error('ERROR!', error ? error.stack : error);

			ctx.status = 500;
			ctx.body = '<script>frameElement.height=0;frameElement.style=\'display:none\'</script>';
			return;
		}
	})

	// iframe (for using on the Falcon US Election page)
	.get('/us-election-2016/iframe.html', async ctx => {
		ctx.set('Cache-Control', 'max-age=500');

		try {
			ctx.body = renderUsElectionIframe(await getUSElectionLocals());
		}
		catch (error) {
			console.error('ERROR!', error ? error.stack : error);

			ctx.status = 500;
			ctx.body = '<script>frameElement.height=0;frameElement.style=\'display:none\'</script>';
			return;
		}
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
if (process.env.ENVIRONMENT === 'development') {
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
