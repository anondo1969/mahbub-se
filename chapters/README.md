# mahbub.se : how the site is put together, and how to add chapters

This site is built from small, separate files so you only ever touch one thing at a time. There is no build step and no framework: just HTML, CSS, and a little vanilla JavaScript.

## The mental model

Think of the site as a book:

- `index.html` is the **cover and binding**: the top bar, the Contents menu, an empty space where one chapter shows at a time, and the footer. You rarely need to open it.
- `chapters/<id>.html` is **one chapter**, content only. One file per chapter.
- `chapters/_index.json` is the **table of contents**: it lists the chapters in order and gives each one its menu label. This single file decides the running order and the chapter numbers.

When someone opens `index.html#phd`, the script reads the table of contents, builds the menu, then drops `chapters/phd.html` into the page and writes the "Chapter 05 · Doctoral work" strip above it. The number (05) comes from the position in `_index.json`, so you never type chapter numbers by hand.

## File map

```
index.html              the shell (top bar, menu, chapter slot, footer)
post.html               renders a single writing post (?section=…&slug=…)
assets/
  app.js                builds the menu, loads chapters, loads post lists
  style.css             all styling (unchanged)
chapters/
  _index.json           the running order + menu labels  ← edit to add/reorder
  about.html            Preface
  early.html            Early years
  career.html           Career
  masters.html          Master's work
  phd.html              Doctoral work
  writing-early.html    Early writing   (shows a post list)
  tools.html            Things I build
  music.html            AI music         (shows a post list)
  writing-current.html  Current writing  (shows a post list)
  README.md             this file
media/                  images, gifs, pdfs, favicon  (unchanged, untouched)
posts/                  Markdown posts + their _index.json files  (unchanged)
```

`media/` and `posts/` are not affected by this change. They keep working exactly as before.

## Editing a chapter

Open the one file, for example `chapters/career.html`, change the words, save. That is the whole job. Do not add `<html>`, `<head>`, or `<body>`: a chapter file is only the content that sits inside the page.

Every chapter follows the same simple shape:

```html
<h1 class="display">Your title, with one <b>bold</b> word.</h1>
<p class="lead">One or two lines that set up the chapter.</p>

... cards, quotes, embeds, whatever the chapter needs ...

<div class="mantra">A short closing line</div>
```

Start with the `<h1 class="display">` and end with the `<div class="mantra">`. The "Chapter NN · Title" strip is added for you, so it is not in the file.

## Adding a chapter

Two steps.

**1. Create the chapter file.** Make `chapters/<id>.html`, where `<id>` is a short name using lowercase letters, numbers, and hyphens (for example `talks`, `side-projects`, `reading`). Put your content in it, following the shape above.

```html
<!-- chapters/talks.html -->
<h1 class="display">Talks and <b>teaching</b>.</h1>
<p class="lead">Places I have spoken, and what I covered.</p>
<div class="card"><h3>A talk</h3><div class="meta">Venue · year</div><p>What it was about.</p></div>
<div class="mantra">Say it plainly</div>
```

**2. Add one line to the table of contents.** Open `chapters/_index.json` and add an entry where you want it to appear. The `id` is the file name without `.html`; the `title` is the menu label.

```json
[
  { "id": "about",           "title": "Preface" },
  { "id": "early",           "title": "Early years" },
  { "id": "career",          "title": "Career" },
  { "id": "talks",           "title": "Talks" },
  { "id": "masters",         "title": "Master's work" },
  ...
]
```

That is all. The menu link appears, the chapter number is worked out from the position, and `index.html#talks` now loads your new chapter. You did not touch `index.html` or `app.js`.

One detail to watch in JSON: every entry except the last needs a trailing comma, and the last entry has none. If the menu ever goes blank, a stray or missing comma in this file is the usual cause.

## Reordering, renaming, removing

- **Reorder:** move a line up or down in `_index.json`. The numbers renumber themselves.
- **Rename a menu label:** change its `title` in `_index.json`. The file name and the link do not change.
- **Rename the file / id:** rename `chapters/<old>.html` to `chapters/<new>.html` and update the `id` in `_index.json` to match. (Any old link using the previous id will fall back to the first chapter.)
- **Remove a chapter:** delete its line from `_index.json`. You can keep or delete the `.html` file; once it is out of the table of contents it no longer appears.

## The two kinds of chapter

**Plain chapters** (most of them: about, early, career, masters, phd, tools) are just content. Adding one is the two steps above, with no JavaScript.

**Post-list chapters** (writing-current, writing-early, music) show a list of Markdown posts pulled from a folder under `posts/`. Their file holds a single empty container that the script fills:

```html
<div id="list-current"><p class="empty-note">Loading…</p></div>
```

You will almost never need a new one of these. But if you ever do want a brand-new writing shelf (a third essay collection, say), it takes one extra step beyond the usual two:

1. Create the chapter file with an empty list container, for example `<div id="list-notes"><p class="empty-note">Loading…</p></div>`.
2. Add the chapter to `_index.json` as usual.
3. Open `assets/app.js`, find the `STREAMS` block near the top, and add one line that connects the chapter id to its posts folder and its container id:

```js
const STREAMS = {
  'writing-current': { key:'current', el:'list-current' },
  'writing-early':   { key:'early',   el:'list-early'   },
  'music':           { key:'music',   el:'list-music'   },
  'notes':           { key:'notes',   el:'list-notes'   }   // new
};
```

4. Create the posts folder `posts/notes/` with its own `_index.json`, the same way `posts/current/` works.

Editing the writing inside an existing post-list chapter (adding or changing actual posts) does not touch any of this: that all lives under `posts/`, exactly as it does today.

## Previewing locally

The site loads its chapters and posts with `fetch`, so it must be served over HTTP. Opening `index.html` straight from the file system (a `file://` address) will show a blank chapter, because browsers block `fetch` from local files.

From the site folder, start a tiny local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Any static host (GitHub Pages, Netlify, your own server) works the same way in production.

## Building blocks you can drop into a chapter

These are the pieces the styling already knows about. Mix and match them inside any chapter file.

**Cards** (three accent colours):

```html
<div class="card"><h3>Heading</h3><div class="meta">Small label</div><p>Body text.</p></div>
<div class="card sage"><h3>Heading</h3><p>Body text.</p></div>
<div class="card clay"><h3>Heading</h3><p>Body text.</p></div>
```

**A card that is itself a link:**

```html
<a class="card link clay" href="https://example.com" target="_blank" rel="noopener">
  <h3>Heading</h3><div class="meta">Source · year</div><p>What it is.</p>
</a>
```

**Pull quote:**

```html
<div class="quote"><p>The sentence you want to stand out.</p></div>
```

**Lead paragraph** (the intro line under the title):

```html
<p class="lead">One or two framing sentences.</p>
```

**Dark feature box** (for one thing you want to highlight):

```html
<div class="feature">
  <span class="label">Label</span>
  <h3>The headline thing</h3>
  <p style="color:var(--paper);opacity:.85;margin:0 0 14px">A short description.</p>
  <div class="chips">
    <a href="#" target="_blank" rel="noopener">A link</a>
    <a href="#" target="_blank" rel="noopener">Another</a>
  </div>
</div>
```

**Timeline:**

```html
<div class="tl">
  <div class="tl-item"><span class="tl-yr">2024 →</span><h4>Title</h4><p>One line.</p></div>
  <div class="tl-item"><span class="tl-yr">2020 - 2024</span><h4>Title</h4><p>One line.</p></div>
</div>
```

**Section label** (the small uppercase divider between groups):

```html
<span class="label">Selected publications</span>
```

**Publication entry** (numbered, with links and an optional award tag):

```html
<div class="pub">
  <span class="pn">3</span><a class="ptitle" href="#" target="_blank" rel="noopener">Paper title</a>
  <div class="venue">Where it appeared, year.</div>
  <div class="pub-links">
    <a href="#" target="_blank" rel="noopener">PDF</a>
    <a href="#" target="_blank" rel="noopener">Code</a>
    <a class="award" href="#" target="_blank" rel="noopener">Best Paper</a>
  </div>
</div>
```

**Link chips** (a row of small buttons):

```html
<div class="chips">
  <a href="#" target="_blank" rel="noopener">One</a>
  <a href="#" target="_blank" rel="noopener">Two</a>
</div>
```

**Embeds.** A video or inline page:

```html
<div class="embed">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="Title" loading="lazy" allowfullscreen></iframe>
  <div class="embed-cap">A caption under the video.</div>
</div>
```

A full-height inline PDF:

```html
<div class="embed pdf"><iframe src="media/your-file.pdf" title="Inline PDF" loading="lazy"></iframe></div>
```

An image or gif with a caption:

```html
<div class="embed">
  <figure>
    <img src="media/your-image.gif" alt="Describe it">
    <figcaption><a href="https://example.com">A caption that links out</a></figcaption>
  </figure>
</div>
```

**Closing line** (every chapter ends with one):

```html
<div class="mantra">A short closing thought</div>
```

## A few things to keep in mind

- A chapter file is content only: no `<html>`, `<head>`, `<body>`, and no `<section>` wrapper.
- Do not put the "Chapter NN" strip in the file: it is generated from `_index.json`.
- Chapter ids are lowercase letters, numbers, and hyphens, and the id must match the file name.
- Chapter numbers are automatic. Reordering `_index.json` reorders and renumbers everything.
- Start each chapter with `<h1 class="display">` and end it with a `<div class="mantra">`.
- Keep serving the site over HTTP (locally with `python3 -m http.server`), never from a `file://` address.
- `media/`, `posts/`, the fonts, and the Markdown reader (marked.js) are unchanged: keep using your existing ones.
