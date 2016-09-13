import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import Promise from 'bluebird';

async function get(url) {
	const res = await Promise.resolve(fetch(url))
		.timeout(10000, new Error(`Timeout - request took too long to respond: ${url}`));
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);
	return res.json();
}

export default class Poller extends EventEmitter {

  data = null;

  // Cache the last successful job.
  // If a job throws an exception this.data should
  // be the result of the last successful job.
  pendingJob = null;

  constructor(schedule, url, dataTransformer, start = true) {
    super();
    this.schedule = schedule;
    this.dataTransformer = dataTransformer || (d => d);
    this.url = url;
    this.job = new CronJob(this.schedule, () => {
      this.tick().catch(reason => {
        console.error('Error completing Summary Card Cron job')
        console.error(reason);
      });
    }, null, start, 'Etc/UTC', null, start);

    if(start) {
      process.nextTick(() => {
        this.emit('start');
      });
    }
  }

  stop() {
    this.job.stop();
    this.emit('stop');
  }

  start() {
    this.job.start();
    this.emit('start');
  }

  clearPending() {
    this.pendingJob = null;
    this.emit('clearpending');
  }

  tick() {

    // Only one job can run at a time
    if (this.pendingJob)
      return this.pendingJob;

    this.pendingJob = get(this.url)
                        .then(this.dataTransformer)
                        .then(data => this.data = data);

    this.pendingJob.catch(err => {
      this.clearPending();
      process.nextTick(() => {
        this.emit('error', err);
      });
      throw err;
    });

    this.pendingJob.then(d => {
      this.clearPending();
      process.nextTick(() => {
        this.emit('tick', this.data);
      });
      return d;
    });

    return this.pendingJob;
  }

}
