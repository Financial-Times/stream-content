# stream-fragments

> This is currently halfway through being renamed from 'brexit-stream-content' to 'stream-fragments'. The Heroku app is still called ft-ig-brexit-stream-content.

Assembles and outputs the 'metacard' used in the [Brexit stream](http://ft.com/brexit).

Warning: this serverside application has no caching, no efficiency – it builds every response from scratch, including loading content from remote URLs. It will break if put under heavy load. Must have a CDN or poller in front of it.

<!--
## Routes

- `/metacard/fragment.json` – outputs the metacard HTML but in a JSON object in the form `{"fragment": "..."}`. The stream app polls this via ft-poller and inlines it into the page.

- `/metacard/fragment-topic-summary.json` – outputs the topic-summary part of the metacard HTML but in a JSON object in the form `{"fragment": "..."}`. The stream app polls this via ft-poller and inlines it into the page.

- `/metacard/fragment-topic-guide.json` – outputs the topic-guide part of the metacard HTML (which is initially hidden in the complete fragment) but in a JSON object in the form `{"fragment": "..."}`. The stream app polls this via ft-poller and inlines it into the page.

- `/metacard/iframe.html` – the metacard, wrapped in an basic HTML document that's suitable for iframing.
	- [CDN-fronted URL for iframing](http://www.ft.com/ig/brexit-metacard-iframe.html) – this doesn't work if you're opted into Next, but doesn't need to as it's for embedding in old FT.com only.

- `/metacard/preview.html` – just for development – the metacard, wrapped in a document that mimics the outer structure of the Next stream app, so you can see how the metacard looks with inherited styles etc.
 -->

## Developing

1. clone this repo
2. `npm install`
3. `npm run develop`
4. code away

Things should refresh in your browser automatically.

## Deploying

1. Optional: make a PR into master, and Heroku will deploy you a live [review app](https://blog.heroku.com/archives/2015/9/3/heroku_flow_pipelines_review_apps_and_github_sync) so you can check it works OK in production. (Heroku will post a link automatically shortly after you create the PR.)
2. When you merge a PR into master (or just commit directly to master) Heroku will deploy to the prod app.

You can check deployment status on the Heroku dashboard.
