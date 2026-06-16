/* ============================================================
   mahbub.se — app.js
   Nav drawer, hash routing, and Markdown-stream loaders
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

/* ---- sections ---- */
const SECTIONS = ['about','early','masters','career','phd','tools','writing-current','writing-early','music'];

/* Markdown-driven sections: section id -> {folder, container} */
const STREAMS = {
  'writing-current': { key:'current', el:'list-current' },
  'writing-early':   { key:'early',   el:'list-early'   },
  'music':           { key:'music',   el:'list-music'   }
};

function showSection(id){
  if(!SECTIONS.includes(id)) id = 'about';
  const el = document.getElementById(id);
  if(!el) return;                       // target section absent on this page (e.g. post.html): do nothing
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.classList.toggle('active', a.dataset.section === id);
  });
  closeNav();
  window.scrollTo({top:0,behavior:'smooth'});
  if(STREAMS[id]) loadStream(id);
}
function go(id){
  if(location.hash.slice(1) === id) showSection(id);
  else location.hash = id;
}
window.addEventListener('hashchange', ()=>showSection(location.hash.slice(1)));

/* ---- load a Markdown stream from its _index.json manifest ---- */
const loaded = {};
async function loadStream(sectionId){
  const s = STREAMS[sectionId];
  if(!s || loaded[s.key]) return;
  loaded[s.key] = true;
  const target = document.getElementById(s.el);
  if(!target) return;
  try{
    const res = await fetch(`posts/${s.key}/_index.json`, {cache:'no-store'});
    if(!res.ok) throw new Error(res.status);
    let items = await res.json();
    items.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    if(!items.length){ target.innerHTML = '<p class="empty-note">Nothing here yet.</p>'; return; }

    // Music: pull each post's <audio> source so the track can play inline in the list.
    if(s.key === 'music'){
      await Promise.all(items.map(async it=>{
        try{
          const r = await fetch(`posts/${s.key}/${it.slug}.md`, {cache:'no-store'});
          if(r.ok) it.audio = extractAudioSrc(await r.text());
        }catch(_){ /* no player for this row; it still links through to the post */ }
      }));
    }

    target.innerHTML = items.map(it=>renderRow(s.key, it)).join('');
  }catch(err){
    target.innerHTML = '<p class="empty-note">Could not load this section yet.</p>';
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

/* ---- init ---- */
document.addEventListener('DOMContentLoaded', ()=>{
  if(!document.getElementById('about')) return;   // post.html has no sections; its own inline script loads the post
  showSection(location.hash.slice(1) || 'about');
});