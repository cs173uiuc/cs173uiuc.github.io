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

  // Saved home page HTML — captured after DOMContentLoaded, restored on home navigation
  let homeHTML = '';

  function getCurrentPage() {
    const params = new URLSearchParams(window.location.search);
    return params.get('page') || 'index.html';
  }

  function setActiveLink(href) {
    document.querySelectorAll('#sidebar-nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.href === href);
    });
  }

  async function typesetMath(element) {
    if (!window.MathJax?.startup?.promise) return;
    await MathJax.startup.promise;
    await MathJax.typesetPromise([element]);
  }

  async function loadPage(href, pushState = true) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (href === 'index.html') {
      mainContent.innerHTML = homeHTML;
      window.scrollTo(0, 0);
      if (pushState) history.pushState({ page: 'index.html' }, '', window.location.pathname);
      setActiveLink('index.html');
      return;
    }

    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(res.status);
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const content = doc.getElementById('content');
      if (!content) throw new Error('no #content found in ' + href);
      mainContent.innerHTML = '';
      mainContent.appendChild(content);
      window.scrollTo(0, 0);
      await typesetMath(mainContent);
      if (pushState) history.pushState({ page: href }, '', '?page=' + href);
      setActiveLink(href);
    } catch (err) {
      mainContent.innerHTML = '<div id="content"><p style="color:var(--accent)">Failed to load page.</p></div>';
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  function buildSidebar() {
    const sidebar = document.createElement('nav');
    sidebar.id = 'sidebar';

    // Header
    const header = document.createElement('div');
    header.id = 'sidebar-header';

    const titleLink = document.createElement('a');
    titleLink.id = 'sidebar-title';
    titleLink.href = window.location.pathname;
    titleLink.textContent = 'Building Blocks for Theoretical Computer Science';
    titleLink.addEventListener('click', e => {
      e.preventDefault();
      loadPage('index.html');
    });

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
      a.href = '?page=' + ch.href;
      a.dataset.href = ch.href;
      a.textContent = ch.title;
      a.addEventListener('click', e => {
        e.preventDefault();
        loadPage(ch.href);
      });
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
    btn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    const title = document.createElement('span');
    title.textContent = 'Building Blocks';

    bar.appendChild(btn);
    bar.appendChild(title);
    return bar;
  }

  window.addEventListener('popstate', e => {
    const page = (e.state && e.state.page) || getCurrentPage();
    loadPage(page, false);
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(buildSidebar());
    document.body.prepend(buildMobileBar());

    // Save home HTML before any navigation
    homeHTML = document.getElementById('main-content').innerHTML;

    // Load the page specified in the URL, if any
    const initialPage = getCurrentPage();
    if (initialPage !== 'index.html') {
      loadPage(initialPage, false);
    } else {
      setActiveLink('index.html');
    }
  });
})();
