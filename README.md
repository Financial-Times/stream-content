# stream-content

ft-ig-stream-content

Assembles and outputs content fragments used in various stream pages, e.g. [Brexit](http://ft.com/brexit) and [US Election](http://ft.com/us-election-2016).

Warning: this serverside application has no caching, no efficiency – it builds every response from scratch, including loading content from remote URLs. It will break if put under heavy load. Must have a CDN or poller in front of it.

## Developing

1. clone this repo
1. add a `.env` file with those variables described in [app.json](./app.json) (you'll need to get the actual values off another dev)
1. `npm install`
1. `npm run develop`
1. code away

Things should refresh in your browser automatically.

## Deploying

1. Optional: make a PR into master, and Heroku will deploy you a live [review app](https://blog.heroku.com/archives/2015/9/3/heroku_flow_pipelines_review_apps_and_github_sync) so you can check it works OK in production. (Heroku will post a link automatically shortly after you create the PR.)
2. When you merge a PR into master (or just commit directly to master) Heroku will deploy to the prod app.

You can check deployment status on the Heroku dashboard.

## Licence
This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).

Please note the MIT licence includes only the software, and does not cover any FT content made available using the software, which is copyright &copy; The Financial Times Limited, all rights reserved. For more information about re-publishing FT content, please contact our [syndication department](http://syndication.ft.com/).
