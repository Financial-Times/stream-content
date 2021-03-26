const Poller = require('./poller');

const summaryCardSheetId = process.env.SUMMARY_CARD_SPREADSHEET || '1G2LIYU8eI4TmN8v-NYicknep6hMEdTv_QBl0cKSOGew';
const berthaUrl = `https://bertha.ig.ft.com/view/publish/gss/${summaryCardSheetId}/cards`;
const interval = '*/30 * * * * *';

const poller = new Poller(interval, berthaUrl, function (data) {
  const absUrl = /^https?\:\/\//;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function rowToCard(row) {
    let renderResponsiveImage = false;
    let image = null;

    if (row.image) {
      if (absUrl.test(row.image)) {
        image = row.image;
      } else {
        const imageWidth = 500;
        image = `https://www.ft.com/__origami/service/image/v2/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F${row.image}?source=ig_stream&fit=scale-down&compression=best&width=${imageWidth}`;
        renderResponsiveImage = true;
      }
    }

    return {
      ...row,
      id: row.id ? row.id.replace(/\s+/g, '').toLowerCase() : '',
      prefix: 'ig-summary-card',
      image,
      renderResponsiveImage,
    };
  }

  if (!Array.isArray(data) || !data.length) {
    throw new Error('Cannot get summary cards');
  }

  return data.reduce((map, row) => {
    const card = rowToCard(row);
    if (!card.id) return map;
    return map.set(card.id, card);
  }, new Map());
});

poller.on('tick', function(d) {
  console.log('tick', d.size);
});

poller.on('error', function(err) {
  console.error('poller error', err);
});

module.exports = async function getCard(id) {
  if (poller.data instanceof Map)
    return poller.data.get(id);
  else
    return (await poller.tick()).get(id);
}
