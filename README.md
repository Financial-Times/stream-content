# brexit-stream-content

Assembles and outputs the 'metacard' used in the [Brexit stream](ft.com/brexit).

Warning: this has no caching, no efficiency – it builds every response from scratch, including loading content from remote URLs. It will break if put under heavy load. Must have a CDN or poller in front of it.

## Routes

- `/metacard/fragment.json` – outputs the metacard HTML but in a JSON object in the form `{"fragment": "..."}`. The stream app polls this via ft-poller and inlines it into the page.

- `/metacard/iframe.html` – the metacard, wrapped in an basic HTML document that's suitable for iframing.
	- [CDN-fronted URL for iframing](http://www.ft.com/ig/brexit-metacard-iframe.html) – this doesn't work if you're opted into Next, but doesn't need to as it's for embedding in old FT.com only.

- `/metacard/preview.html` – just for development – the metacard, wrapped in a document that mimics the outer structure of the Next stream app, so you can see how the metacard looks with inherited styles etc.

## Developing

1. clone this repo
2. `npm install`
3. Use two terminal tabs:
	- `npm run start:dev` (start server via nodemon)
	- `npm run styles:dev` (compile Sass in watch mode)
4. Open http://localhost:5000/
5. Code

## Deploying

1. Optional: make a PR, and Heroku will deploy you a live [review app](https://blog.heroku.com/archives/2015/9/3/heroku_flow_pipelines_review_apps_and_github_sync) so you can double-check the preview.html route. (Heroku will post a link on the PR automatically.)
2. When you merge a PR into master (or just commit directly to master) Heroku will deploy to the prod app.

You can check deployment status on the Heroku dashboard.
