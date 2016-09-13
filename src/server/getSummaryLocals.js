import Promise from 'bluebird';
import { CronJob } from 'cron';

async function fetchCards() {
	const url = `http://bertha.ig.ft.com/view/publish/gss/1G2LIYU8eI4TmN8v-NYicknep6hMEdTv_QBl0cKSOGew/cards`;
	const res = await Promise.resolve(fetch(url))
		.timeout(10000, new Error(`Timeout - brexit-polling took too long to respond: ${url}`));
	if (!res.ok) throw new Error(`Request failed with ${res.status}: ${url}`);
	return res.json();
}

let pending;
let cardIndex;

async function refreshData() {

  let cards;

  if (pending) {
    cards = await pending;
  } else {
    cards = pending = await fetchCards();
  }

  if (!cards || !cards.length) {
    throw new Error('Cannot get summary cards');
  }

  return cardIndex = cards.reduce((map, card) => {
    if (!card.id) return map;
    return map.set(card.id, card);
  }, new Map());
}

const job = new CronJob('*/30 * * * * *', function() {
  refreshData()
    .then(cardIndex => {
      console.log(`Got ${cardIndex.size} summary cards`);
    })
    .catch(reason => {
      console.error('Cron error')
      console.error(reason);
    });
}, null, true, 'Etc/UTC', null, true);

export default async function getCard(id) {

  if (cardIndex) {
    return cardIndex.get(id);
  }

  return (await refreshData()).get(id);

}
