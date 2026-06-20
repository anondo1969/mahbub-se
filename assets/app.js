/* ============================================================
   mahbub.se : app.js
   Nav drawer, manifest-driven "Contents" menu, chapter loader,
   and Markdown post-list loaders.

   How it fits together:
   - chapters/_index.json   the running order + menu labels
   - chapters/<id>.html      one file per chapter (content only)
   - this file               builds the menu, loads a chapter on demand,
                             and writes the "Chapter NN · Title" strip.
   See chapters/README.md for how to add or edit a chapter.
   ============================================================ */

/* ---- nav drawer ---- */
function toggleNav(){
  document.getElementById('panel').classList.toggle('open');
  document.getElementById('scrim').classList.toggle('open');
  document.getElementById('burger').classList.toggle('open');
}
function closeNav(){
  document.getElementById('panel').classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
  document.getElementById('burger').classList.remove('open');
}

/* ---- chapters that stream a Markdown post list ----
   chapter id -> { posts folder under posts/, container id inside the chapter file } */
const STREAMS = {
  'writing-current': { key:'current', el:'list-current' },
  'writing-early':   { key:'early',   el:'list-early'   },
  'music':           { key:'music',   el:'list-music'   }
};

/* ---- manifest + in-memory caches ---- */
let CHAPTERS = [];            // [{id, title}] from chapters/_index.json (the running order)
const chapterTextCache = {};  // id  -> raw chapter .html text (fetched once)
const streamCache = {};       // key -> rendered post-list HTML (rendered once)

/* Load the chapter running order once. Used by both index.html and post.html. */
async function loadManifest(){
  if(CHAPTERS.length) return CHAPTERS;
  try{
    const res = await fetch('chapters/_index.json', {cache:'no-store'});
    if(res.ok) CHAPTERS = await res.json();
  }catch(_){ /* leave CHAPTERS empty; the menu simply won't render */ }
  return CHAPTERS;
}

/* Build the "Contents" menu from the manifest.
   The numbers (01, 02, …) come from the order in the list, so they are never typed by hand.
   On index.html the links are bare #id; on post.html they point at index.html#id. */
function buildNav(){
  const host = document.getElementById('navLinks');
  if(!host) return;
  const onIndex = !!document.getElementById('chapter-host');
  const prefix = onIndex ? '' : 'index.html';
  host.innerHTML = CHAPTERS.map((c, i)=>{
    const num = String(i + 1).padStart(2, '0');
    return `<a class="nav-link" data-section="${c.id}" href="${prefix}#${c.id}">`
         + `<span class="nav-num">${num}</span>${escapeHtml(c.title)}</a>`;
  }).join('');
}

/* The header strip ("Chapter 05 · Doctoral work"), built from the manifest. */
function chapterHead(id){
  const i = CHAPTERS.findIndex(c => c.id === id);
  if(i < 0) return '';
  const num = String(i + 1).padStart(2, '0');
  return `<div class="chapter-head"><span class="chapter-num">Chapter ${num} · `
       + `${escapeHtml(CHAPTERS[i].title)}</span><div class="chapter-rule"></div></div>`;
}

/* Re-play the page fade-in after a chapter's content is swapped in. */
function restartFade(el){
  el.style.animation = 'none';
  void el.offsetWidth;          // force reflow
  el.style.animation = '';
}

/* ---- show one chapter (index.html only) ---- */
async function showSection(id){
  await loadManifest();
  const ids = CHAPTERS.map(c => c.id);
  if(!ids.includes(id)) id = ids[0] || 'about';   // unknown hash falls back to the first chapter

  const host = document.getElementById('chapter-host');
  if(!host) return;            // not on index.html (e.g. post.html): nothing to show

  document.querySelectorAll('.nav-link').forEach(a=>{
    a.classList.toggle('active', a.dataset.section === id);
  });
  closeNav();
  window.scrollTo({top:0, behavior:'smooth'});

  let text = chapterTextCache[id];
  if(text === undefined){
    host.innerHTML = chapterHead(id) + '<p class="loading">One moment: pulling this from the shelf…</p>';
    try{
      const res = await fetch(`chapters/${id}.html`, {cache:'no-store'});
      if(!res.ok) throw new Error(res.status);
      text = await res.text();
      chapterTextCache[id] = text;
    }catch(err){
      host.innerHTML = chapterHead(id)
        + '<p class="empty-note">This one would not come off the shelf. Check your connection and try refreshing.</p>';
      return;
    }
  }

  host.innerHTML = chapterHead(id) + text;
  restartFade(host);

  if(STREAMS[id]) loadStream(id);   // fill any post list this chapter contains
}

function go(id){
  if(location.hash.slice(1) === id) showSection(id);
  else location.hash = id;
}
window.addEventListener('hashchange', ()=> showSection(location.hash.slice(1)));

/* ---- load a Markdown post list from its _index.json manifest ---- */
async function loadStream(sectionId){
  const s = STREAMS[sectionId];
  if(!s) return;
  const target = document.getElementById(s.el);
  if(!target) return;

  if(streamCache[s.key] !== undefined){   // already rendered once this session
    target.innerHTML = streamCache[s.key];
    return;
  }
  try{
    const res = await fetch(`posts/${s.key}/_index.json`, {cache:'no-store'});
    if(!res.ok) throw new Error(res.status);
    let items = await res.json();
    items.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    if(!items.length){
      streamCache[s.key] = '<p class="empty-note">Nothing here yet.</p>';
      target.innerHTML = streamCache[s.key];
      return;
    }

    // Music: pull each post's <audio> source so the track can play inline in the list.
    if(s.key === 'music'){
      await Promise.all(items.map(async it=>{
        try{
          const r = await fetch(`posts/${s.key}/${it.slug}.md`, {cache:'no-store'});
          if(r.ok) it.audio = extractAudioSrc(await r.text());
        }catch(_){ /* no player for this row; it still links through to the post */ }
      }));
    }

    streamCache[s.key] = items.map(it => renderRow(s.key, it)).join('');
    target.innerHTML = streamCache[s.key];
  }catch(err){
    // do not cache the error: a refresh can try again
    target.innerHTML = '<p class="empty-note">This one would not come off the shelf. Check your connection and try refreshing.</p>';
  }
}

/* Pull the src of the first <audio> tag out of a Markdown post. */
function extractAudioSrc(md){
  const m = md.match(/<audio[^>]*?\ssrc\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : '';
}

function renderRow(section, it){
  const bn = it.lang === 'bn';
  const kind = it.type ? ` · ${it.type}` : '';
  const date = (it.date||'').replace(/-/g,' · ');
  const href = `post.html?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(it.slug)}`;

  // Music rows stay on the page and embed a player; the title links through for lyrics + translation.
  if(section === 'music'){
    const player = it.audio
      ? `<div class="row-audio"><audio controls preload="none" src="${it.audio}">Your browser does not support the audio element.</audio></div>`
      : '';
    return `<div class="post-row music${bn?' bn':''}">
    <span class="pdate">${date}${kind}</span>
    <h3><a href="${href}">${escapeHtml(it.title||it.slug)}</a></h3>
    <p>${escapeHtml(it.excerpt||'')}</p>
    ${player}
    <a class="row-more" href="${href}">Lyrics &amp; translation →</a>
  </div>`;
  }

  return `<a class="post-row${bn?' bn':''}" href="${href}">
    <span class="pdate">${date}${kind}</span>
    <h3>${escapeHtml(it.title||it.slug)}</h3>
    <p>${escapeHtml(it.excerpt||'')}</p>
  </a>`;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---- init (runs on both pages) ---- */
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadManifest();
  buildNav();
  if(document.getElementById('chapter-host')){      // index.html only
    showSection(location.hash.slice(1) || (CHAPTERS[0] && CHAPTERS[0].id) || 'about');
  }
  /* post.html has no chapter host; its own inline script loads the single post. */
});
