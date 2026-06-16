---
title: On building quietly
date: 2026-06-02
lang: en
type: note
excerpt: Infrastructure as an act of care, with a photo, an embedded talk video, and a linked PDF.
---

# On building quietly

Most of the work that matters is invisible. A pipeline that does not fail at 3am. A deployment that just keeps serving. The best infrastructure is the kind nobody has to think about.

<figure><img src="media/desk.svg" alt="The morning desk"><figcaption>The morning desk, where most of this gets written</figcaption></figure>

## A photo hosted with the post

The image above is a normal Markdown image. Drop a file into the `media/` folder and reference it. Either of these works:

- Markdown: `![The morning desk](media/desk.svg)`
- Raw HTML, when you want a caption: a `<figure>` with an `<img>` and a `<figcaption>`, as above.

## A video that lives on YouTube

The video below is not stored on the site: it is embedded from elsewhere. Paste this snippet into the Markdown and it renders here. Replace the `src` with your own YouTube or Vimeo embed URL.

<div class="embed"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Embedded talk" loading="lazy" allowfullscreen></iframe><div class="embed-cap">Embed · YouTube / Vimeo / self-hosted</div></div>

## A PDF hosted on Zenodo

The same idea for documents. Link out to a PDF that lives on Zenodo, Drive, or anywhere with a URL:

<a class="doc-card" href="https://arxiv.org/abs/2603.24216" target="_blank" rel="noopener"><span class="doc-ico">PDF</span><span><span class="dt">Citation-Constellation (arXiv 2603.24216)</span><span class="dm">Open &middot; hosted externally</span></span></a>

If you would rather show the PDF inline, use an embed instead of a card:

<div class="embed pdf"><iframe src="https://arxiv.org/pdf/2603.24216" title="Inline PDF" loading="lazy"></iframe></div>

> The useful thing should be the easy thing.

Three rules I try to keep true:

- Make failure loud and recovery quiet.
- Document the thing while it is still fresh.
- Leave the system better than you found it.
