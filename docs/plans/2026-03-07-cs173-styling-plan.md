# CS173 Website Styling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the bare CS173 HTML textbook into a modern, styled site with a persistent sidebar, dark/light toggle, and electric blue accent — hostable on GitHub Pages at `cs173uiuc.github.io`.

**Architecture:** A shared `style.css` defines all visual design via CSS custom properties. A shared `nav.js` injects the sidebar and mobile bar at runtime and manages theme persistence via localStorage. Each HTML file is updated to HTML5 with links to these two files and its content wrapped in `<div id="content">`. Files are flattened to repo root for clean GitHub Pages URLs.

**Tech Stack:** Vanilla HTML5, CSS custom properties, vanilla JS (no frameworks, no build tools), MathJax 4 (already present in chapter files), GitHub Pages

---

## Task 1: Initialize git repo and flatten file structure

**Files:**
- Modify: repo root (git init + remote)
- Move: all files from `mfleck.cs.illinois.edu/building-blocks/version-1.4/` to repo root

**Step 1: Initialize git and add remote**

```bash
cd c:/Users/maand/Downloads/CodingProjects_Big/CS173Mirror2
git init
git remote add origin https://github.com/cs173uiuc/cs173uiuc.github.io.git
```

Expected: `Initialized empty Git repository` (or `Reinitialized` if already done)

**Step 2: Copy all HTML files and figure folders to repo root**

```bash
cp mfleck.cs.illinois.edu/building-blocks/version-1.4/*.html .
cp -r mfleck.cs.illinois.edu/building-blocks/version-1.4/*-figs .
cp -r mfleck.cs.illinois.edu/building-blocks/version-1.4/general-figs .
```

Expected: All HTML files and `-figs` directories now exist at repo root.

**Step 3: Verify files are at root**

```bash
ls *.html
```

Expected output includes: `index.html logic.html proofs.html` (and all others)

**Step 4: Commit the flattened structure**

```bash
git add *.html *-figs general-figs docs
git commit -m "chore: flatten directory structure to repo root for GitHub Pages"
```

---

## Task 2: Create style.css

**Files:**
- Create: `style.css`

**Step 1: Create the stylesheet**

Create `style.css` at repo root with this exact content:

```css
/* ── Tokens ─────────────────────────────────────── */
:root {
  --bg:      #0d1117;
  --surface: #161b22;
  --text:    #e6edf3;
  --heading: #f0f6fc;
  --accent:  #58a6ff;
  --muted:   #8b949e;
  --border:  #30363d;
  --sidebar-width: 260px;
}
:root.light {
  --bg:      #ffffff;
  --surface: #f6f8fa;
  --text:    #24292f;
  --heading: #1f2328;
  --accent:  #0969da;
  --muted:   #57606a;
  --border:  #d0d7de;
}

/* ── Reset ───────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }

/* ── Base ────────────────────────────────────────── */
body {
  background: var(--bg);
  color: var(--text);
  font-family: Georgia, serif;
  font-size: 18px;
  line-height: 1.7;
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ─────────────────────────────────────── */
#sidebar {
  width: var(--sidebar-width);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  overflow-y: auto;
  z-index: 100;
}

#sidebar-header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

#sidebar-title {
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  line-height: 1.4;
}
#sidebar-title:hover { color: var(--accent); }

#theme-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.45rem;
  flex-shrink: 0;
  transition: color 0.2s, border-color 0.2s;
}
#theme-toggle:hover { color: var(--accent); border-color: var(--accent); }

#sidebar-nav { padding: 0.75rem 0; flex: 1; }

#sidebar-nav a {
  display: block;
  padding: 0.38rem 1rem;
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.8rem;
  color: var(--muted);
  text-decoration: none;
  border-radius: 6px;
  margin: 0.1rem 0.5rem;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#sidebar-nav a:hover { background: var(--bg); color: var(--text); }
#sidebar-nav a.active { background: var(--accent); color: #fff; font-weight: 500; }

/* ── Main content ────────────────────────────────── */
#content {
  margin-left: var(--sidebar-width);
  max-width: 780px;
  padding: 3rem 3rem 6rem;
  width: 100%;
}

/* ── Typography ──────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
  font-family: Inter, system-ui, sans-serif;
  color: var(--heading);
  line-height: 1.3;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
h1 {
  font-size: 2rem;
  border-left: 4px solid var(--accent);
  padding-left: 0.75rem;
  margin-top: 0;
}
h2 { font-size: 1.45rem; border-left: 3px solid var(--border); padding-left: 0.65rem; }
h3 { font-size: 1.15rem; }
h4 { font-size: 1rem; }

p { margin-bottom: 1rem; }

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
li { margin-bottom: 0.3rem; }

img { max-width: 100%; height: auto; display: block; margin: 1.5rem 0; }

hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }

/* ── Tables ──────────────────────────────────────── */
table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
th { background: var(--surface); font-family: Inter, system-ui, sans-serif; font-size: 0.9rem; }

/* ── Code ────────────────────────────────────────── */
code, pre {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.875em;
  background: var(--surface);
  border-radius: 4px;
}
code { padding: 0.15em 0.4em; }
pre { padding: 1rem; overflow-x: auto; border: 1px solid var(--border); margin-bottom: 1rem; }

/* ── Home page ───────────────────────────────────── */
.home-hero {
  text-align: center;
  padding: 2rem 0 1.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
}
.home-hero img { margin: 0 auto 1.5rem; max-width: 160px; }
.home-hero h1 {
  border: none;
  padding: 0;
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
}
.home-hero .author {
  font-family: Inter, system-ui, sans-serif;
  color: var(--muted);
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.notice {
  color: var(--accent);
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--accent);
  border-radius: 6px;
  display: inline-block;
}

/* ── Mobile ──────────────────────────────────────── */
#mobile-bar {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 48px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  align-items: center;
  padding: 0 1rem;
  gap: 0.75rem;
  z-index: 200;
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}
#hamburger {
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

@media (max-width: 768px) {
  #mobile-bar { display: flex; }
  #sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  #sidebar.open { transform: translateX(0); }
  #content {
    margin-left: 0;
    padding: 4.5rem 1.25rem 3rem;
    max-width: 100%;
  }
}
```

**Step 2: Verify the file exists**

```bash
ls style.css
```

Expected: `style.css`

**Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add shared stylesheet with dark/light theme and sidebar layout"
```

---

## Task 3: Create nav.js

**Files:**
- Create: `nav.js`

**Step 1: Create nav.js at repo root**

```javascript
(function () {
  const chapters = [
    { title: "Preface",                        href: "preface.html" },
    { title: "Ch 1: Math Review",              href: "math-review.html" },
    { title: "Ch 2: Logic",                    href: "logic.html" },
    { title: "Ch 3: Proofs",                   href: "proofs.html" },
    { title: "Ch 4: Number Theory",            href: "number-theory.html" },
    { title: "Ch 5: Sets",                     href: "sets.html" },
    { title: "Ch 6: Relations",                href: "relations.html" },
    { title: "Ch 7: Functions and onto",       href: "functions-onto.html" },
    { title: "Ch 8: Functions and one-to-one", href: "functions-one-to-one.html" },
    { title: "Ch 9: Graphs",                   href: "graphs.html" },
    { title: "Ch 10: Collections of Sets",     href: "cos.html" },
    { title: "Ch 11: Two-way Bounding",        href: "bounding.html" },
    { title: "Ch 12: Induction",               href: "induction.html" },
    { title: "Ch 13: Recursive Definition",    href: "recursive-definition.html" },
    { title: "Ch 14: Trees",                   href: "trees.html" },
    { title: "Ch 15: Big-O",                   href: "big-o.html" },
    { title: "Ch 16: Algorithms",              href: "algorithms.html" },
    { title: "Ch 17: NP",                      href: "NP.html" },
    { title: "Ch 18: Proof by Contradiction",  href: "contradiction.html" },
    { title: "Ch 19: State Diagrams",          href: "state-diagrams.html" },
    { title: "Ch 20: Countability",            href: "countability.html" },
    { title: "Ch 21: Planar Graphs",           href: "planargraphs.html" },
    { title: "Appendix A: Jargon",             href: "jargon.html" },
    { title: "Appendix B: Readings",           href: "readings.html" },
  ];

  // Apply saved theme before DOM renders to avoid flash
  const savedTheme = localStorage.getItem('cs173-theme');
  if (savedTheme === 'light') document.documentElement.classList.add('light');

  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  function buildSidebar() {
    const sidebar = document.createElement('nav');
    sidebar.id = 'sidebar';

    // Header
    const header = document.createElement('div');
    header.id = 'sidebar-header';

    const titleLink = document.createElement('a');
    titleLink.id = 'sidebar-title';
    titleLink.href = 'index.html';
    titleLink.textContent = 'Building Blocks for Theoretical Computer Science';

    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle light/dark theme');
    toggle.textContent = document.documentElement.classList.contains('light') ? '\u263E' : '\u2600\uFE0E';

    toggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
      localStorage.setItem('cs173-theme', isLight ? 'light' : 'dark');
      toggle.textContent = isLight ? '\u263E' : '\u2600\uFE0E';
    });

    header.appendChild(titleLink);
    header.appendChild(toggle);

    // Chapter links
    const navDiv = document.createElement('div');
    navDiv.id = 'sidebar-nav';

    chapters.forEach(ch => {
      const a = document.createElement('a');
      a.href = ch.href;
      a.textContent = ch.title;
      if (ch.href === currentFile) a.classList.add('active');
      navDiv.appendChild(a);
    });

    sidebar.appendChild(header);
    sidebar.appendChild(navDiv);
    return sidebar;
  }

  function buildMobileBar() {
    const bar = document.createElement('div');
    bar.id = 'mobile-bar';

    const btn = document.createElement('button');
    btn.id = 'hamburger';
    btn.setAttribute('aria-label', 'Open navigation');
    btn.textContent = '\u2630';

    const title = document.createElement('span');
    title.textContent = 'Building Blocks';

    btn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    bar.appendChild(btn);
    bar.appendChild(title);
    return bar;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(buildSidebar());
    document.body.prepend(buildMobileBar());
  });
})();
```

**Step 2: Commit**

```bash
git add nav.js
git commit -m "feat: add sidebar navigation and theme toggle script"
```

---

## Task 4: Update index.html

**Files:**
- Modify: `index.html`

`index.html` is the only file without MathJax and has a different structure (`<center>`, `<font>` tags, no chapter-header table). Treat it first as the reference for verifying the full design.

**Step 1: Replace index.html with the updated version**

Replace the entire file with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Building Blocks for Theoretical Computer Science</title>
  <link rel="stylesheet" href="style.css">
  <script src="nav.js" defer></script>
</head>
<body>

<div id="content">
  <div class="home-hero">
    <img src="general-figs/blocks.jpg" alt="Building blocks">
    <h1>Building Blocks for Theoretical Computer Science</h1>
    <p class="author">Margaret M. Fleck</p>
  </div>

  <p class="notice">Version 1.4 &mdash; Changes (esp. bug fixes) may happen throughout spring 2026.</p>

  <p>
    This is Version 1.4, the first to be HTML based.
    Users of previous versions should note that later chapters have been renumbered/reordered.
  </p>

  <p>
    Also see our collection of
    <a href="https://mfleck.cs.illinois.edu/study-problems/index.html">study problems</a>
    with annotated solutions.
  </p>

  <ul>
    <li><a href="preface.html">Preface</a></li>
    <li><a href="math-review.html">Chapter 1: Math Review</a></li>
    <li><a href="logic.html">Chapter 2: Logic</a></li>
    <li><a href="proofs.html">Chapter 3: Proofs</a></li>
    <li><a href="number-theory.html">Chapter 4: Number Theory</a></li>
    <li><a href="sets.html">Chapter 5: Sets</a></li>
    <li><a href="relations.html">Chapter 6: Relations</a></li>
    <li><a href="functions-onto.html">Chapter 7: Functions and onto</a></li>
    <li><a href="functions-one-to-one.html">Chapter 8: Functions and one-to-one</a></li>
    <li><a href="graphs.html">Chapter 9: Graphs</a></li>
    <li><a href="cos.html">Chapter 10: Collections of Sets</a></li>
    <li><a href="bounding.html">Chapter 11: Two-way Bounding</a></li>
    <li><a href="induction.html">Chapter 12: Induction</a></li>
    <li><a href="recursive-definition.html">Chapter 13: Recursive Definition</a></li>
    <li><a href="trees.html">Chapter 14: Trees</a></li>
    <li><a href="big-o.html">Chapter 15: Big-O</a></li>
    <li><a href="algorithms.html">Chapter 16: Algorithms</a></li>
    <li><a href="NP.html">Chapter 17: NP</a></li>
    <li><a href="contradiction.html">Chapter 18: Proof by Contradiction</a></li>
    <li><a href="state-diagrams.html">Chapter 19: State Diagrams</a></li>
    <li><a href="countability.html">Chapter 20: Countability</a></li>
    <li><a href="planargraphs.html">Chapter 21: Planar Graphs</a></li>
    <li><a href="jargon.html">Appendix A: Jargon</a></li>
    <li><a href="readings.html">Appendix B: Acknowledgements and Supplementary Readings</a></li>
  </ul>
</div>

</body>
</html>
```

**Step 2: Open in browser and verify**

Open `index.html` in a browser (double-click the file or use a local server).

Check:
- Dark background, sidebar on left with full chapter list
- "Building Blocks" title in sidebar header with theme toggle button (☀︎)
- Hero section: blocks.jpg image + title + author
- Blue notice box visible
- No chapter link is highlighted as active (index.html is not in the chapters array — correct)
- Click ☀︎ toggle: page switches to light mode and back
- Resize window narrow: hamburger ☰ appears in top bar, sidebar collapses

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: update index.html to HTML5 with sidebar and theme support"
```

---

## Task 5: Update all chapter HTML files

**Files:**
- Modify: all 24 remaining HTML files (preface, ch1–21, appendix A–B)

All chapter files share this identical structure pattern. The transformation is mechanical:

**Before (top of every chapter file):**
```html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <title>Building Blocks</title>
</head>
<body style="font-family: Palatino, Bookman, serif;"
  topmargin=50   bottommargin=50   rightmargin=50  leftmargin=50>

<script>
MathJax = { ... };
</script>
<script defer src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js"></script>

<table>
<tr>
<td><img src="general-figs/blocks.jpg" alt="building blocks"></td>
<td> <h2 style="font-family:Jazz LET, fantasy;">   Building Blocks<br>
    for<br>
    Theoretical Computer Science
    </h2>
  <br>
  <h3>Margaret M. Fleck</h3>
</td>
</tr>
</table>

<hr>
<h1 style="font-family:Jazz LET, fantasy;">
Chapter N: Title</h1>
<hr>
```

**After:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chapter N: Title – Building Blocks</title>
  <link rel="stylesheet" href="style.css">
  <script>
  MathJax = { ... };  ← keep exactly as-is
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js"></script>
  <script src="nav.js" defer></script>
</head>
<body>

<div id="content">

<h1>Chapter N: Title</h1>
```

**Rules:**
1. The entire `<table>` block (logo + book title/author) is removed — that information lives in the sidebar
2. The `<hr>` lines flanking the chapter `<h1>` are removed — CSS handles spacing
3. Remove `style="font-family:Jazz LET, fantasy;"` from the `<h1>`
4. The `</body></html>` at the end: insert `</div>` before `</body>` to close `#content`
5. Do NOT touch anything between the chapter `<h1>` and `</body>` — all math, text, figures, and links are preserved exactly

**Step 1: Update preface.html**

Apply the transformation above to `preface.html`. The title should be:
```html
<title>Preface – Building Blocks</title>
```
And the `<h1>`:
```html
<h1>Preface</h1>
```

**Step 2: Update math-review.html through readings.html**

Apply the same transformation to each of these files in order:

| File | `<title>` text | `<h1>` text |
|---|---|---|
| `math-review.html` | `Chapter 1: Math Review – Building Blocks` | `Chapter 1: Math Review` |
| `logic.html` | `Chapter 2: Logic – Building Blocks` | `Chapter 2: Logic` |
| `proofs.html` | `Chapter 3: Proofs – Building Blocks` | `Chapter 3: Proofs` |
| `number-theory.html` | `Chapter 4: Number Theory – Building Blocks` | `Chapter 4: Number Theory` |
| `sets.html` | `Chapter 5: Sets – Building Blocks` | `Chapter 5: Sets` |
| `relations.html` | `Chapter 6: Relations – Building Blocks` | `Chapter 6: Relations` |
| `functions-onto.html` | `Chapter 7: Functions and onto – Building Blocks` | `Chapter 7: Functions and onto` |
| `functions-one-to-one.html` | `Chapter 8: Functions and one-to-one – Building Blocks` | `Chapter 8: Functions and one-to-one` |
| `graphs.html` | `Chapter 9: Graphs – Building Blocks` | `Chapter 9: Graphs` |
| `cos.html` | `Chapter 10: Collections of Sets – Building Blocks` | `Chapter 10: Collections of Sets` |
| `bounding.html` | `Chapter 11: Two-way Bounding – Building Blocks` | `Chapter 11: Two-way Bounding` |
| `induction.html` | `Chapter 12: Induction – Building Blocks` | `Chapter 12: Induction` |
| `recursive-definition.html` | `Chapter 13: Recursive Definition – Building Blocks` | `Chapter 13: Recursive Definition` |
| `trees.html` | `Chapter 14: Trees – Building Blocks` | `Chapter 14: Trees` |
| `big-o.html` | `Chapter 15: Big-O – Building Blocks` | `Chapter 15: Big-O` |
| `algorithms.html` | `Chapter 16: Algorithms – Building Blocks` | `Chapter 16: Algorithms` |
| `NP.html` | `Chapter 17: NP – Building Blocks` | `Chapter 17: NP` |
| `contradiction.html` | `Chapter 18: Proof by Contradiction – Building Blocks` | `Chapter 18: Proof by Contradiction` |
| `state-diagrams.html` | `Chapter 19: State Diagrams – Building Blocks` | `Chapter 19: State Diagrams` |
| `countability.html` | `Chapter 20: Countability – Building Blocks` | `Chapter 20: Countability` |
| `planargraphs.html` | `Chapter 21: Planar Graphs – Building Blocks` | `Chapter 21: Planar Graphs` |
| `jargon.html` | `Appendix A: Jargon – Building Blocks` | `Appendix A: Jargon` |
| `readings.html` | `Appendix B: Readings – Building Blocks` | `Appendix B: Acknowledgements and Supplementary Readings` |

**Step 3: Spot-check logic.html in browser**

Open `logic.html` and verify:
- Sidebar appears, "Ch 2: Logic" is highlighted in blue
- MathJax math renders correctly (look for any formula in the chapter)
- Chapter title `<h1>` has blue left border
- No "Building Blocks" image or author block appears in the main content area
- Theme toggle works and persists on refresh

**Step 4: Commit**

```bash
git add preface.html math-review.html logic.html proofs.html number-theory.html \
        sets.html relations.html functions-onto.html functions-one-to-one.html \
        graphs.html cos.html bounding.html induction.html recursive-definition.html \
        trees.html big-o.html algorithms.html NP.html contradiction.html \
        state-diagrams.html countability.html planargraphs.html jargon.html readings.html
git commit -m "feat: update all chapter HTML files to HTML5 with sidebar and theme support"
```

---

## Task 6: Push to GitHub and enable GitHub Pages

**Step 1: Push to main**

```bash
git branch -M main
git push -u origin main
```

Expected: `Branch 'main' set up to track remote branch 'main' from 'origin'.`

**Step 2: Enable GitHub Pages**

Go to `https://github.com/cs173uiuc/cs173uiuc.github.io/settings/pages`

Set:
- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`

Click Save.

**Step 3: Verify deployment**

Wait ~60 seconds, then open `https://cs173uiuc.github.io/` in a browser.

Check:
- Home page loads with sidebar
- Navigate to a chapter, verify active link highlight
- Verify MathJax renders
- Toggle theme, reload — confirm preference persists
- Test on a mobile screen size (or DevTools mobile emulation): hamburger menu appears and works
