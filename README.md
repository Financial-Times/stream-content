# brexit-stream-content

Assembles and outputs the 'metacard' used in the [Brexit stream](ft.com/brexit).

No caching, no efficiency – it builds every response from scratch, including loading content from remote URLs. It will break if put under heavy load. Must have a CDN or poller in front of it.

## Routes

- `/metacard/fragment.json` – outputs the metacard HTML but in a JSON object in the form `{"fragment": "..."}`. The stream app polls this via ft-poller and inlines it into the page.

- `/metacard/iframe.html` – the metacard, wrapped in an basic HTML document that's suitable for iframing.
	- [CDN-fronted URL for iframing](http://www.ft.com/ig/brexit-metacard-iframe.html) – this doesn't work if you're opted into Next, but doesn't need to as it's for embedding in old FT.com only.

- `/metacard/preview.html` – just for development – the metacard, wrapped in a document that mimics the outer structure of the Next stream app, so you can see how the metacard looks with inherited styles etc.
