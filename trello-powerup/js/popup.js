/* popup.js — orchestrates data fetch + export dispatch */

var t = TrelloPowerUp.iframe();

var allLists  = [];
var allCards  = [];

/* ── boot ── */
t.board('id', 'name', 'lists', 'cards')
  .then(function(board) {
    allLists = board.lists;
    allCards = board.cards;
    buildListPicker(board.lists);
  })
  .catch(function(err) {
    showStatus('Failed to load board: ' + err.message, true);
  });

/* ── list picker ── */
function buildListPicker(lists) {
  var picker = document.getElementById('list-picker');
  picker.innerHTML = '';
  lists.forEach(function(list) {
    var lbl = document.createElement('label');
    var cb  = document.createElement('input');
    cb.type  = 'checkbox';
    cb.value = list.id;
    cb.checked = true;
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(' ' + list.name));
    picker.appendChild(lbl);
  });
}

document.querySelectorAll('input[name="scope"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    document.getElementById('list-picker').classList.toggle('hidden', this.value !== 'lists');
  });
});

/* ── helpers ── */
function getSelectedListIds() {
  var scope = document.querySelector('input[name="scope"]:checked').value;
  if (scope === 'board') return allLists.map(function(l) { return l.id; });
  return Array.from(document.querySelectorAll('#list-picker input:checked')).map(function(cb) { return cb.value; });
}

function getFilteredCards() {
  var listIds   = getSelectedListIds();
  var attachOnly = document.getElementById('only-with-attachments').checked;

  return allCards.filter(function(card) {
    if (!listIds.includes(card.idList)) return false;
    if (attachOnly && (!card.attachments || card.attachments.length === 0)) return false;
    return true;
  });
}

function listName(listId) {
  var l = allLists.find(function(x) { return x.id === listId; });
  return l ? l.name : listId;
}

function showStatus(msg, isError) {
  var el = document.getElementById('status');
  el.textContent = msg;
  el.classList.remove('hidden', 'error');
  if (isError) el.classList.add('error');
}

function setButtons(disabled) {
  ['btn-pdf', 'btn-csv', 'btn-html'].forEach(function(id) {
    document.getElementById(id).disabled = disabled;
  });
}

/* ── fetch full card details (attachments, desc, cover image) ── */
function fetchCardDetails(cards) {
  showStatus('Fetching card details… (0 / ' + cards.length + ')');
  var done = 0;
  return Promise.all(cards.map(function(card) {
    return t.getRestApi().getToken()
      .then(function(token) {
        var key = 'YOUR_TRELLO_APP_KEY'; // same key as powerup.js
        var url = 'https://api.trello.com/1/cards/' + card.id
          + '?attachments=true&attachment_fields=name,url,mimeType,bytes'
          + '&fields=name,desc,idList,labels,due,cover,url'
          + '&key=' + key + '&token=' + token;
        return fetch(url);
      })
      .then(function(r) { return r.json(); })
      .then(function(detail) {
        done++;
        showStatus('Fetching card details… (' + done + ' / ' + cards.length + ')');
        return detail;
      });
  }));
}

/* ── CSV export ── */
document.getElementById('btn-csv').addEventListener('click', function() {
  var cards = getFilteredCards();
  if (!cards.length) { showStatus('No cards match the current scope/filter.', true); return; }
  setButtons(true);

  fetchCardDetails(cards).then(function(details) {
    exportCSV(details);
    setButtons(false);
    showStatus('CSV downloaded ✓');
  }).catch(function(e) {
    setButtons(false);
    showStatus('Error: ' + e.message, true);
  });
});

/* ── PDF export ── */
document.getElementById('btn-pdf').addEventListener('click', function() {
  var cards = getFilteredCards();
  if (!cards.length) { showStatus('No cards match the current scope/filter.', true); return; }
  setButtons(true);
  showStatus('Opening PDF renderer…');

  fetchCardDetails(cards).then(function(details) {
    t.modal({
      title: 'Print / Save as PDF',
      url:   buildPdfUrl(details),
      fullscreen: true
    });
    setButtons(false);
    showStatus('');
  }).catch(function(e) {
    setButtons(false);
    showStatus('Error: ' + e.message, true);
  });
});

/* ── HTML export ── */
document.getElementById('btn-html').addEventListener('click', function() {
  var cards = getFilteredCards();
  if (!cards.length) { showStatus('No cards match the current scope/filter.', true); return; }
  setButtons(true);

  fetchCardDetails(cards).then(function(details) {
    exportHTML(details);
    setButtons(false);
    showStatus('Offline HTML downloaded ✓');
  }).catch(function(e) {
    setButtons(false);
    showStatus('Error: ' + e.message, true);
  });
});

/* ═══════════════════════════════════════════
   CSV EXPORTER
═══════════════════════════════════════════ */
function exportCSV(cards) {
  var rows = [['Card Name','List','Description','Labels','Due Date',
               'Attachment Names','Attachment URLs','Card URL']];

  cards.forEach(function(c) {
    var attachNames = (c.attachments || []).map(function(a) { return a.name; }).join(' | ');
    var attachURLs  = (c.attachments || []).map(function(a) { return a.url;  }).join(' | ');
    var labels      = (c.labels     || []).map(function(l) { return l.name || l.color; }).join(', ');
    rows.push([
      c.name,
      listName(c.idList),
      (c.desc || '').replace(/\n/g, ' '),
      labels,
      c.due ? new Date(c.due).toLocaleDateString() : '',
      attachNames,
      attachURLs,
      c.url || ''
    ]);
  });

  var csv = rows.map(function(row) {
    return row.map(function(cell) {
      var s = String(cell == null ? '' : cell);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
  }).join('\r\n');

  download('trello-export.csv', 'text/csv', csv);
}

/* ═══════════════════════════════════════════
   PDF — opens pdf-render.html as a modal
═══════════════════════════════════════════ */
function buildPdfUrl(cards) {
  // Pass data via sessionStorage key so URL stays short
  var key = 'trello_pdf_data_' + Date.now();
  sessionStorage.setItem(key, JSON.stringify({
    cards:  cards,
    lists:  allLists
  }));
  return './pdf-render.html?key=' + encodeURIComponent(key);
}

/* ═══════════════════════════════════════════
   OFFLINE HTML EXPORTER (Snap2HTML-style)
═══════════════════════════════════════════ */
function exportHTML(cards) {
  var byList = {};
  allLists.forEach(function(l) { byList[l.id] = { name: l.name, cards: [] }; });
  cards.forEach(function(c) {
    if (byList[c.idList]) byList[c.idList].cards.push(c);
  });

  var listSections = Object.values(byList).filter(function(l) { return l.cards.length; }).map(function(l) {
    var cardItems = l.cards.map(function(c) {
      var labels = (c.labels || []).map(function(lb) {
        return '<span class="lbl" style="background:' + labelColor(lb.color) + '">' + (lb.name || lb.color) + '</span>';
      }).join('');

      var due = c.due ? '<span class="due">📅 ' + new Date(c.due).toLocaleDateString() + '</span>' : '';

      var attachList = (c.attachments || []).length
        ? '<ul class="attach">' + (c.attachments || []).map(function(a) {
            return '<li><a href="' + esc(a.url) + '" target="_blank">📎 ' + esc(a.name) + '</a></li>';
          }).join('') + '</ul>'
        : '';

      var cover = '';
      if (c.cover && c.cover.idAttachment) {
        var att = (c.attachments || []).find(function(a) { return a.id === c.cover.idAttachment; });
        if (att && att.url) cover = '<img class="cover" src="' + esc(att.url) + '" alt="cover">';
      }

      var desc = c.desc ? '<p class="desc">' + esc(c.desc).replace(/\n/g,'<br>') + '</p>' : '';

      return '<details class="card"><summary>' + esc(c.name) + ' ' + labels + ' ' + due + '</summary>'
        + cover + desc + attachList
        + '<a class="cardlink" href="' + esc(c.url || '#') + '" target="_blank">Open in Trello ↗</a>'
        + '</details>';
    }).join('');

    return '<details class="list" open><summary>' + esc(l.name)
      + ' <span class="count">(' + l.cards.length + ')</span></summary>'
      + cardItems + '</details>';
  }).join('');

  var html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trello Board Export</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#172b4d;background:#f4f5f7;padding:16px}
#toolbar{background:#0052cc;color:#fff;padding:10px 14px;border-radius:6px;margin-bottom:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
#toolbar h1{font-size:15px;flex:1}
#search{padding:6px 10px;border-radius:4px;border:none;font-size:13px;width:220px}
#stats{font-size:11px;opacity:.8}
.list{background:#ebecf0;border-radius:6px;margin-bottom:10px;padding:8px 10px}
.list>summary{font-weight:700;font-size:14px;cursor:pointer;padding:4px 0;user-select:none}
.count{font-weight:400;font-size:11px;color:#6b778c}
.card{background:#fff;border-radius:4px;margin-top:6px;padding:6px 8px;box-shadow:0 1px 2px rgba(0,0,0,.1)}
.card>summary{cursor:pointer;font-weight:500;user-select:none;list-style:none;display:flex;align-items:center;flex-wrap:wrap;gap:4px}
.card>summary::-webkit-details-marker{display:none}
.lbl{font-size:10px;padding:2px 6px;border-radius:10px;color:#fff;font-weight:600}
.due{font-size:11px;color:#6b778c}
.cover{max-width:100%;max-height:200px;border-radius:4px;margin:8px 0;object-fit:cover}
.desc{margin:8px 0;white-space:pre-wrap;font-size:12px;color:#344563}
.attach{margin:6px 0 4px 0;padding-left:14px}
.attach li{margin:2px 0}
.attach a{color:#0052cc;text-decoration:none;font-size:12px}
.attach a:hover{text-decoration:underline}
.cardlink{font-size:11px;color:#6b778c;text-decoration:none}
.cardlink:hover{text-decoration:underline}
.hidden{display:none!important}
#no-results{text-align:center;color:#6b778c;padding:24px;display:none}
</style>
</head>
<body>
<div id="toolbar">
  <h1>📋 Trello Export</h1>
  <input id="search" type="search" placeholder="🔍 Search cards…" oninput="doSearch(this.value)">
  <span id="stats"></span>
</div>
<div id="board">
${listSections}
</div>
<div id="no-results">No cards match your search.</div>
<script>
var allCards=document.querySelectorAll('.card');
var allLists=document.querySelectorAll('.list');
document.getElementById('stats').textContent=allCards.length+' cards';

function doSearch(q){
  q=q.toLowerCase().trim();
  var visible=0;
  allCards.forEach(function(card){
    var text=card.textContent.toLowerCase();
    var show=!q||text.includes(q);
    card.classList.toggle('hidden',!show);
    if(show){visible++;card.open=!!q;}
  });
  allLists.forEach(function(list){
    var any=Array.from(list.querySelectorAll('.card')).some(function(c){return !c.classList.contains('hidden');});
    list.classList.toggle('hidden',!any);
    if(q&&any)list.open=true;
  });
  document.getElementById('no-results').style.display=visible?'none':'block';
  document.getElementById('stats').textContent=visible+(q?' matching':'')+(visible===1?' card':' cards');
}
</script>
</body>
</html>`;

  download('trello-export.html', 'text/html', html);
}

/* ── utils ── */
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function labelColor(c) {
  var map={green:'#61bd4f',yellow:'#f2d600',orange:'#ff9f1a',red:'#eb5a46',
           purple:'#c377e0',blue:'#0079bf',sky:'#00c2e0',lime:'#51e898',
           pink:'#ff78cb',black:'#344563'};
  return map[c] || '#6b778c';
}

function download(filename, mime, content) {
  var blob = new Blob([content], {type: mime});
  var a    = document.createElement('a');
  a.href   = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
