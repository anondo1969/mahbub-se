#!/usr/bin/env python3
"""Regenerate posts/<stream>/_index.json from each post's front matter.

The front-matter parser mirrors post.html's parseFrontmatter() exactly, so the
list view and the post view always agree on title/date/lang/type/excerpt.
"""
import json, os, re

STREAMS = ("current", "early", "music")
# Same shape post.html matches: optional BOM, --- ... --- block at the top.
FM = re.compile(r"^\ufeff?---\s*\n(.*?)\n---\s*\n?", re.S)


def parse_front_matter(text):
    meta = {}
    m = FM.match(text)
    if not m:
        return meta
    for line in m.group(1).split("\n"):
        i = line.find(":")                       # first colon only (values may contain ':')
        if i > -1:
            key = line[:i].strip()
            val = re.sub(r'^["\']|["\']$', "", line[i + 1:].strip())  # strip one wrapping quote
            if key:
                meta[key] = val
    return meta


def build(stream):
    folder = os.path.join("posts", stream)
    if not os.path.isdir(folder):
        return None
    items = []
    for fn in os.listdir(folder):
        if not fn.endswith(".md"):
            continue
        with open(os.path.join(folder, fn), encoding="utf-8") as fh:
            meta = parse_front_matter(fh.read())
        if str(meta.get("draft", "")).strip().lower() in ("true", "yes", "1"):
            continue                              # optional: drafts stay out of the list
        items.append({
            "slug":    fn[:-3],
            "title":   meta.get("title", fn[:-3]),
            "date":    meta.get("date", ""),
            "lang":    meta.get("lang", "en"),
            "type":    meta.get("type", ""),
            "excerpt": meta.get("excerpt", ""),
        })
    # Deterministic order so diffs stay clean: newest first, ties broken by slug.
    items.sort(key=lambda x: x["slug"])
    items.sort(key=lambda x: x["date"], reverse=True)
    return items


def main():
    for stream in STREAMS:
        items = build(stream)
        if items is None:
            continue
        out = os.path.join("posts", stream, "_index.json")
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(json.dumps(items, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
