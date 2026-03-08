# CS173 Website Styling Design

**Date:** 2026-03-07
**Project:** Building Blocks for Theoretical Computer Science (CS173 mirror)
**Goal:** Make the site aesthetically pleasing, modern, and hostable on GitHub Pages at `cs173uiuc.github.io`

---

## Overview

The existing site is a collection of bare HTML4 files with no shared stylesheet, inline presentational attributes, and a deep directory path unsuitable for clean GitHub Pages hosting. This design adds a shared CSS + JS layer to give the site a modern CS/tech aesthetic with a persistent sidebar, dark/light toggle, and electric blue accent — without touching any mathematical content or MathJax configuration.

---

## File Structure

Flatten the current deep path (`mfleck.cs.illinois.edu/building-blocks/version-1.4/`) to the repo root:

```
cs173uiuc.github.io (repo root)
├── index.html
├── logic.html
├── proofs.html
├── ... (all 22 HTML files)
├── general-figs/
├── graphs-figs/
├── ... (all figure folders)
├── style.css        ← new
└── nav.js           ← new
```

GitHub Pages serves from the root of `main`. Each chapter is accessible at `cs173uiuc.github.io/<chapter>.html`.

---

## Visual Design

**Approach:** Shared `style.css` + `nav.js`. No build tools. No external dependencies beyond MathJax (already present).

**Layout:** CSS Grid — fixed 260px sidebar on the left, scrollable main content on the right. Sidebar stays fixed while content scrolls.

### Color Tokens (CSS custom properties)

| Token | Dark mode | Light mode |
|---|---|---|
| `--bg` | `#0d1117` | `#ffffff` |
| `--surface` | `#161b22` | `#f6f8fa` |
| `--text` | `#e6edf3` | `#24292f` |
| `--accent` | `#58a6ff` | `#0969da` |
| `--muted` | `#8b949e` | `#57606a` |
| `--border` | `#30363d` | `#d0d7de` |

Default: dark mode.

### Typography

- **Body text:** `Georgia, serif` — blends naturally with MathJax math rendering
- **UI chrome (sidebar, buttons):** `Inter, system-ui, sans-serif`
- **Code:** `'JetBrains Mono', monospace`
- **Base size:** 18px, line-height 1.7

### Accent Details

- Chapter headings: left blue border-bar
- Active sidebar link: blue background pill
- Dark/light toggle: unicode icon (☀︎ / ☾), sidebar header

---

## Sidebar & Navigation

**Contents:**
- Book title header + dark/light toggle button
- Full chapter list (preface, chapters 1–21, 2 appendices) as links
- Active page auto-detected via `window.location.pathname`

**Behavior:**
- Desktop (≥768px): always visible, fixed position
- Mobile (<768px): collapses, hamburger button (☰) in sticky top bar toggles it as an overlay
- Pure CSS transitions, no external libraries

**Dark/light toggle:**
- Saves preference to `localStorage`
- Applies/removes `.light` class on `<html>`

**Chapter list** defined as a JS array in `nav.js` — sidebar HTML injected at runtime, so each HTML file needs no manual sidebar markup.

---

## Per-HTML File Changes

Each of the 22 HTML files receives the same mechanical treatment:

1. Replace HTML4 doctype with HTML5 + add `<meta charset="UTF-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1">`
2. Add `<link rel="stylesheet" href="style.css">` in `<head>`
3. Add `<script src="nav.js" defer></script>` in `<head>`
4. Wrap existing body content in `<div id="content">`
5. Strip legacy presentational markup: `body` inline styles, `topmargin`/`bottommargin`/`leftmargin`/`rightmargin` attributes, `<center>` tags, `<font>` tags

**Not touched:** All text content, figures, inter-chapter links, MathJax configuration and scripts.

---

## GitHub Pages Deployment

- Repo: `https://github.com/cs173uiuc/cs173uiuc.github.io.git`
- Branch: `main`
- GitHub Pages source: root of `main`
- No CI/CD or build step required — static files served directly
