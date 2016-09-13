import Poller from './poller';

const berthaUrl = 'http://bertha.ig.ft.com/view/publish/gss/1G2LIYU8eI4TmN8v-NYicknep6hMEdTv_QBl0cKSOGew/cards';
const interval = '*/30 * * * * *';

const poller = new Poller(interval, berthaUrl, function (data) {
  if (!Array.isArray(data) || !data.length) {
    throw new Error('Cannot get summary cards');
  }

  return data.reduce((map, row) => {
    if (!row.id) return map;
    return map.set(row.id, row);
  }, new Map());
});

poller.on('tick', function(d) {
  console.log('tick', d.size);
});

export default async function getCard(id) {
  if (poller.data instanceof Map)
    return poller.data.get(id);
  else
    return (await poller.tick()).get(id);
}
