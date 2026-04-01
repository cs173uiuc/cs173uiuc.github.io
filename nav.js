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
  const pageCache = new Map();
  let prefetchPromise = null;
  let warmRenderPromise = null;
  const searchIndex = new Map();
  let searchBuildPromise = null;
  let currentSearchQuery = '';
  let activeSearch = null;
  let currentHits = [];
  let activeHitIndex = -1;
  let searchControls = null;
  const highlightStorageKey = 'cs173-highlights';
  let highlightMenu = null;
  let highlightIdCounter = 0;

  function getCurrentPage() {
    const params = new URLSearchParams(window.location.search);
    return params.get('page') || 'index.html';
  }

  function setActiveLink(href) {
    document.querySelectorAll('#sidebar-nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.href === href);
    });
  }

  function isEditableTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  async function typesetMath(element) {
    if (!window.MathJax?.startup?.promise) return;
    await MathJax.startup.promise;
    await MathJax.typesetPromise([element]);
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getStoredHighlights() {
    try {
      const parsed = JSON.parse(localStorage.getItem(highlightStorageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveStoredHighlights(entries) {
    localStorage.setItem(highlightStorageKey, JSON.stringify(entries));
  }

  function generateHighlightId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return 'hl-' + crypto.randomUUID();
    }
    highlightIdCounter += 1;
    return 'hl-' + Date.now().toString(36) + '-' + highlightIdCounter.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function getCurrentContentRoot() {
    return document.querySelector('#main-content #content');
  }

  function getSelectionInContent() {
    const content = getCurrentContentRoot();
    const selection = window.getSelection();
    if (!content || !selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (!common || !content.contains(common)) return null;
    const text = selection.toString().trim();
    if (!text) return null;
    return { content, selection, range, text };
  }

  function rangeStartsInsideHighlight(range) {
    const startNode = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer.parentElement;
    return !!startNode?.closest?.('mark.user-highlight');
  }

  function computeRangeOffsets(content, range) {
    const prior = range.cloneRange();
    prior.selectNodeContents(content);
    prior.setEnd(range.startContainer, range.startOffset);
    return {
      start: prior.toString().length,
      length: range.toString().length,
    };
  }

  function createRangeFromOffsets(content, start, length) {
    if (start < 0 || length <= 0) return null;
    const end = start + length;
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null);
    let node;
    let offset = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;

    while ((node = walker.nextNode())) {
      const nodeLength = (node.nodeValue || '').length;
      const nextOffset = offset + nodeLength;

      if (!startNode && start >= offset && start < nextOffset) {
        startNode = node;
        startOffset = start - offset;
      }
      if (!endNode && end > offset && end <= nextOffset) {
        endNode = node;
        endOffset = end - offset;
      }
      if (startNode && endNode) break;
      offset = nextOffset;
    }

    if (!startNode || !endNode) return null;
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  function wrapRangeWithHighlight(range, id, comment) {
    if (range.collapsed) return false;
    const mark = document.createElement('mark');
    mark.className = 'user-highlight';
    mark.dataset.highlightId = id;
    if (comment) {
      mark.title = comment;
      mark.dataset.comment = comment;
      mark.setAttribute('aria-label', comment);
      mark.tabIndex = -1;
    }
    try {
      range.surroundContents(mark);
      return true;
    } catch {
      return false;
    }
  }

  function applyHighlightsForCurrentPage(pageOverride) {
    const content = getCurrentContentRoot();
    if (!content) return;
    const page = pageOverride || getCurrentPage();
    const entries = getStoredHighlights().filter(entry => entry.page === page);
    entries.forEach(entry => {
      if (!entry || typeof entry.start !== 'number' || typeof entry.length !== 'number') return;
      const entryId = String(entry.id || '');
      const alreadyApplied = Array.from(content.querySelectorAll('mark.user-highlight'))
        .some(mark => (mark.dataset.highlightId || '') === entryId);
      if (alreadyApplied) return;
      const range = createRangeFromOffsets(content, entry.start, entry.length);
      if (!range || range.collapsed) return;
      if (rangeStartsInsideHighlight(range)) return;
      wrapRangeWithHighlight(range, entry.id, entry.comment || '');
    });
  }

  function removeStoredHighlight(id) {
    const entryId = String(id || '');
    if (!entryId) return;
    const entries = getStoredHighlights();
    const filtered = entries.filter(entry => String(entry?.id || '') !== entryId);
    if (filtered.length !== entries.length) {
      saveStoredHighlights(filtered);
    }
  }

  function unwrapHighlight(mark) {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  }

  function removeHoveredHighlight(mark) {
    if (!(mark instanceof HTMLElement) || !mark.matches('mark.user-highlight')) return;
    removeStoredHighlight(mark.dataset.highlightId);
    hideHighlightMenu();
    unwrapHighlight(mark);
  }

  function maybeRemoveHoveredHighlight(target) {
    if (!(target instanceof Element)) return;
    const highlight = target.closest('mark.user-highlight');
    if (!highlight) return;
    removeHoveredHighlight(highlight);
  }

  function hideHighlightMenu() {
    if (!highlightMenu) return;
    highlightMenu.hidden = true;
    highlightMenu.removeAttribute('data-visible');
  }

  function saveCurrentSelectionHighlight(withComment) {
    const selected = getSelectionInContent();
    if (!selected || rangeStartsInsideHighlight(selected.range)) {
      hideHighlightMenu();
      return;
    }
    const offsets = computeRangeOffsets(selected.content, selected.range);
    const comment = withComment ? window.prompt('Add a comment for this highlight:') : '';
    if (withComment && comment === null) {
      hideHighlightMenu();
      return;
    }

    const id = generateHighlightId();
    if (!wrapRangeWithHighlight(selected.range, id, (comment || '').trim())) {
      hideHighlightMenu();
      return;
    }

    const entries = getStoredHighlights();
    entries.push({
      id,
      page: getCurrentPage(),
      start: offsets.start,
      length: offsets.length,
      comment: (comment || '').trim(),
    });
    saveStoredHighlights(entries);
    selected.selection.removeAllRanges();
    hideHighlightMenu();
  }

  function buildHighlightMenu() {
    const menu = document.createElement('div');
    menu.id = 'selection-menu';
    menu.hidden = true;

    const commentBtn = document.createElement('button');
    commentBtn.type = 'button';
    commentBtn.textContent = 'Add comment';
    commentBtn.addEventListener('click', () => saveCurrentSelectionHighlight(true));

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save highlight';
    saveBtn.addEventListener('click', () => saveCurrentSelectionHighlight(false));

    menu.appendChild(commentBtn);
    menu.appendChild(saveBtn);
    return menu;
  }

  function positionHighlightMenu(range) {
    if (!highlightMenu) return;
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      hideHighlightMenu();
      return;
    }

    highlightMenu.hidden = false;
    highlightMenu.setAttribute('data-visible', 'true');
    const menuWidth = highlightMenu.offsetWidth || 180;
    const top = Math.max(8, rect.bottom + window.scrollY + 8);
    const left = Math.min(
      Math.max(8, rect.left + window.scrollX),
      window.scrollX + window.innerWidth - menuWidth - 8
    );
    highlightMenu.style.top = top + 'px';
    highlightMenu.style.left = left + 'px';
  }

  function maybeShowHighlightMenu() {
    const selected = getSelectionInContent();
    if (!selected || rangeStartsInsideHighlight(selected.range)) {
      hideHighlightMenu();
      return;
    }
    positionHighlightMenu(selected.range);
  }

  function buildSearchRegex(query, options) {
    const source = escapeRegExp(query);
    const pattern = options.wholeWord ? '\\b' + source + '\\b' : source;
    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  }

  function createSnippet(text, startIndex, termLength) {
    const context = 70;
    const start = Math.max(0, startIndex - context);
    const end = Math.min(text.length, startIndex + termLength + context);
    const prefix = start > 0 ? '... ' : '';
    const suffix = end < text.length ? ' ...' : '';
    return prefix + text.slice(start, end).trim() + suffix;
  }

  function clearHighlights(root) {
    root.querySelectorAll('mark.search-hit').forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    });
    currentHits = [];
    activeHitIndex = -1;
  }

  function updateHitStatus() {
    if (!searchControls || !searchControls.hitCount) return;
    if (!currentHits.length || activeHitIndex < 0) {
      searchControls.hitCount.textContent = '0/0';
      if (searchControls.prevBtn) searchControls.prevBtn.disabled = true;
      if (searchControls.nextBtn) searchControls.nextBtn.disabled = true;
      return;
    }

    searchControls.hitCount.textContent = String(activeHitIndex + 1) + '/' + String(currentHits.length);
    if (searchControls.prevBtn) searchControls.prevBtn.disabled = false;
    if (searchControls.nextBtn) searchControls.nextBtn.disabled = false;
  }

  function focusHit(index, scroll = true) {
    if (!currentHits.length) {
      updateHitStatus();
      return;
    }

    const normalized = ((index % currentHits.length) + currentHits.length) % currentHits.length;
    currentHits.forEach(hit => hit.classList.remove('active'));
    activeHitIndex = normalized;
    const target = currentHits[activeHitIndex];
    target.classList.add('active');
    if (scroll) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateHitStatus();
  }

  function moveHit(step) {
    if (!currentHits.length) return;
    focusHit(activeHitIndex + step);
  }

  function collectSearchHits(root, query, options) {
    clearHighlights(root);
    if (!query) {
      updateHitStatus();
      return;
    }

    const regex = buildSearchRegex(query, options);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        if (parent.closest('.MathJax, .MathJax_Display, mjx-container')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach(textNode => {
      const text = textNode.nodeValue || '';
      regex.lastIndex = 0;
      let match;
      let last = 0;
      let replaced = false;
      const frag = document.createDocumentFragment();

      while ((match = regex.exec(text)) !== null) {
        if (match.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        }
        const mark = document.createElement('mark');
        mark.className = 'search-hit';
        mark.textContent = match[0];
        frag.appendChild(mark);
        currentHits.push(mark);
        last = match.index + match[0].length;
        replaced = true;
        if (match.index === regex.lastIndex) regex.lastIndex += 1;
      }

      if (!replaced) return;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
    });

    if (currentHits.length) {
      focusHit(0, false);
    } else {
      updateHitStatus();
    }
  }

  function applySearchToCurrentPage() {
    const content = document.querySelector('#main-content #content');
    if (!content) return;
    if (!activeSearch || !activeSearch.query) {
      clearHighlights(content);
      updateHitStatus();
      return;
    }

    collectSearchHits(content, activeSearch.query, {
      wholeWord: !!activeSearch.wholeWord,
      caseSensitive: !!activeSearch.caseSensitive,
    });
  }

  function wrapContentHTML(innerHTML) {
    return '<div id="content">' + innerHTML + '</div>';
  }

  function extractContentDataFromText(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const content = doc.getElementById('content');
    if (!content) throw new Error('no #content found');
    return {
      rawHTML: content.innerHTML,
      searchText: normalizeText(content.textContent || ''),
    };
  }

  function storePageCache(href, data) {
    const existing = pageCache.get(href) || {};
    const merged = {
      rawHTML: data.rawHTML ?? existing.rawHTML ?? '',
      searchText: data.searchText ?? existing.searchText ?? '',
      renderedHTML: data.renderedHTML ?? existing.renderedHTML,
    };
    pageCache.set(href, merged);
    searchIndex.set(href, { text: merged.searchText });
    return merged;
  }

  async function getPageData(href) {
    const cached = pageCache.get(href);
    if (cached && cached.rawHTML) return cached;

    const res = await fetch(href);
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    const data = extractContentDataFromText(text);
    return storePageCache(href, data);
  }

  async function prefetchAllPages() {
    if (prefetchPromise) {
      await prefetchPromise;
      return;
    }

    prefetchPromise = Promise.allSettled(
      chapters.map(ch => getPageData(ch.href).catch(() => null))
    ).then(() => {});
    await prefetchPromise;
  }

  async function warmRenderedPages() {
    if (warmRenderPromise) {
      await warmRenderPromise;
      return;
    }

    warmRenderPromise = (async () => {
      await prefetchAllPages();
      const worker = document.createElement('div');
      worker.style.position = 'absolute';
      worker.style.left = '-100000px';
      worker.style.top = '0';
      worker.style.width = '780px';
      worker.style.visibility = 'hidden';
      worker.style.pointerEvents = 'none';
      document.body.appendChild(worker);

      try {
        for (const ch of chapters) {
          const entry = pageCache.get(ch.href);
          if (!entry || !entry.rawHTML || entry.renderedHTML) continue;
          worker.innerHTML = wrapContentHTML(entry.rawHTML);
          await typesetMath(worker);
          const content = worker.querySelector('#content');
          if (content) {
            entry.renderedHTML = content.outerHTML;
          }
        }
      } finally {
        worker.remove();
      }
    })();

    await warmRenderPromise;
  }

  async function getPageSearchText(href) {
    try {
      const entry = await getPageData(href);
      return { text: entry.searchText || '' };
    } catch {
      const value = { text: '' };
      searchIndex.set(href, value);
      return value;
    }
  }

  async function buildSearchIndex() {
    if (searchBuildPromise) {
      await searchBuildPromise;
      return;
    }

    searchBuildPromise = Promise.all(chapters.map(ch => getPageSearchText(ch.href))).then(() => {});
    await searchBuildPromise;
  }

  function searchLessons(query, options) {
    const results = [];
    const regex = buildSearchRegex(query, options);

    chapters.forEach(ch => {
      const entry = searchIndex.get(ch.href);
      if (!entry || !entry.text) return;

      regex.lastIndex = 0;
      let count = 0;
      let firstMatchIndex = -1;
      let match;

      while ((match = regex.exec(entry.text)) !== null) {
        count += 1;
        if (firstMatchIndex < 0) firstMatchIndex = match.index;
        if (match.index === regex.lastIndex) regex.lastIndex += 1;
      }

      if (count > 0) {
        results.push({
          href: ch.href,
          title: ch.title,
          count,
          snippet: createSnippet(entry.text, firstMatchIndex, query.length),
        });
      }
    });

    return results;
  }

  function buildSearchPanel() {
    const panel = document.createElement('div');
    panel.id = 'sidebar-search';

    const form = document.createElement('form');
    form.id = 'sidebar-search-form';

    const input = document.createElement('input');
    input.id = 'sidebar-search-input';
    input.type = 'search';
    input.placeholder = 'Search lessons';
    input.autocomplete = 'off';

    const options = document.createElement('div');
    options.id = 'search-options';

    const wholeWordLabel = document.createElement('label');
    const wholeWord = document.createElement('input');
    wholeWord.type = 'checkbox';
    wholeWord.id = 'search-whole-word';
    wholeWordLabel.appendChild(wholeWord);
    wholeWordLabel.appendChild(document.createTextNode(' Whole word'));

    const caseSensitiveLabel = document.createElement('label');
    const caseSensitive = document.createElement('input');
    caseSensitive.type = 'checkbox';
    caseSensitive.id = 'search-case-sensitive';
    caseSensitiveLabel.appendChild(caseSensitive);
    caseSensitiveLabel.appendChild(document.createTextNode(' Case sensitive'));

    options.appendChild(wholeWordLabel);
    options.appendChild(caseSensitiveLabel);

    const actions = document.createElement('div');
    actions.id = 'search-actions';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Find';

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Clear';

    actions.appendChild(submit);
    actions.appendChild(clear);

    const status = document.createElement('div');
    status.id = 'search-status';
    status.setAttribute('aria-live', 'polite');

    const results = document.createElement('div');
    results.id = 'search-results';

    const hitNav = document.createElement('div');
    hitNav.id = 'search-hit-nav';

    const prevHit = document.createElement('button');
    prevHit.type = 'button';
    prevHit.textContent = 'Prev';
    prevHit.disabled = true;

    const hitCount = document.createElement('span');
    hitCount.id = 'search-hit-count';
    hitCount.textContent = '0/0';

    const nextHit = document.createElement('button');
    nextHit.type = 'button';
    nextHit.textContent = 'Next';
    nextHit.disabled = true;

    hitNav.appendChild(prevHit);
    hitNav.appendChild(hitCount);
    hitNav.appendChild(nextHit);

    searchControls = {
      input,
      wholeWord,
      caseSensitive,
      prevBtn: prevHit,
      nextBtn: nextHit,
      hitCount,
      status,
    };

    prevHit.addEventListener('click', () => moveHit(-1));
    nextHit.addEventListener('click', () => moveHit(1));

    function clearResults() {
      status.textContent = '';
      results.innerHTML = '';
    }

    function renderResults(items) {
      results.innerHTML = '';

      if (!items.length) {
        status.textContent = 'No matches found.';
        return;
      }

      status.textContent = 'Found matches in ' + items.length + ' lesson(s).';

      items.forEach(item => {
        const card = document.createElement('a');
        card.className = 'search-result';
        card.href = '?page=' + item.href;

        const title = document.createElement('div');
        title.className = 'search-result-title';
        title.textContent = item.title;

        const meta = document.createElement('div');
        meta.className = 'search-result-meta';
        meta.textContent = item.count + (item.count === 1 ? ' match' : ' matches');

        const snippet = document.createElement('div');
        snippet.className = 'search-result-snippet';
        snippet.textContent = item.snippet;

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(snippet);

        card.addEventListener('click', e => {
          e.preventDefault();
          activeSearch = {
            query: currentSearchQuery,
            wholeWord: wholeWord.checked,
            caseSensitive: caseSensitive.checked,
          };
          loadPage(item.href);
        });

        results.appendChild(card);
      });
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) {
        currentSearchQuery = '';
        clearResults();
        return;
      }

      currentSearchQuery = query;

      status.textContent = 'Searching lessons...';
      submit.disabled = true;

      try {
        await buildSearchIndex();
        activeSearch = {
          query,
          wholeWord: wholeWord.checked,
          caseSensitive: caseSensitive.checked,
        };
        const items = searchLessons(query, {
          wholeWord: wholeWord.checked,
          caseSensitive: caseSensitive.checked,
        });
        renderResults(items);
        applySearchToCurrentPage();
      } catch {
        status.textContent = 'Search failed. Please try again.';
      } finally {
        submit.disabled = false;
      }
    });

    clear.addEventListener('click', () => {
      input.value = '';
      currentSearchQuery = '';
      activeSearch = null;
      clearResults();
      applySearchToCurrentPage();
      input.focus();
    });

    form.appendChild(input);
    form.appendChild(options);
    form.appendChild(actions);
    panel.appendChild(form);
    panel.appendChild(status);
    panel.appendChild(hitNav);
    panel.appendChild(results);
    return panel;
  }

  async function loadPage(href, pushState = true) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (href === 'index.html') {
      mainContent.innerHTML = homeHTML;
      applyHighlightsForCurrentPage('index.html');
      window.scrollTo(0, 0);
      if (pushState) history.pushState({ page: 'index.html' }, '', window.location.pathname);
      setActiveLink('index.html');
      return;
    }

    try {
      const entry = await getPageData(href);
      mainContent.innerHTML = entry.renderedHTML || wrapContentHTML(entry.rawHTML);
      window.scrollTo(0, 0);
      if (!entry.renderedHTML) {
        await typesetMath(mainContent);
        const rendered = mainContent.querySelector('#content');
        if (rendered) {
          entry.renderedHTML = rendered.outerHTML;
        }
      }
      applySearchToCurrentPage();
      applyHighlightsForCurrentPage(href);
      if (pushState) history.pushState({ page: href }, '', '?page=' + href);
      setActiveLink(href);
    } catch (err) {
      const localHelp = window.location.protocol === 'file:'
        ? '<p>Local file mode blocks chapter fetches. Run a local server and open http://localhost:8000 instead.</p><p>Example: <code>python -m http.server 8000</code></p>'
        : '';
      mainContent.innerHTML = '<div id="content"><p style="color:var(--accent)">Failed to load page.</p>' + localHelp + '</div>';
      updateHitStatus();
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
      a.addEventListener('pointerenter', () => {
        getPageData(ch.href).catch(() => {});
      }, { once: true });
      a.addEventListener('click', e => {
        e.preventDefault();
        loadPage(ch.href);
      });
      navDiv.appendChild(a);
    });

    sidebar.appendChild(header);
    sidebar.appendChild(buildSearchPanel());
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

  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isEditableTarget(e.target)) return;

    if (e.key === '/' && searchControls?.input) {
      e.preventDefault();
      searchControls.input.focus();
      searchControls.input.select();
      return;
    }

    if (e.key.toLowerCase() === 'n' && currentHits.length) {
      e.preventDefault();
      moveHit(e.shiftKey ? -1 : 1);
    }
  });

  document.addEventListener('selectionchange', () => {
    if (!highlightMenu) return;
    maybeShowHighlightMenu();
  });

  document.addEventListener('mousedown', e => {
    if (!highlightMenu || highlightMenu.hidden) return;
    if (highlightMenu.contains(e.target)) return;
    hideHighlightMenu();
  });

  document.addEventListener('scroll', hideHighlightMenu, { passive: true });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(buildSidebar());
    document.body.prepend(buildMobileBar());
    highlightMenu = buildHighlightMenu();
    document.body.appendChild(highlightMenu);
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.addEventListener('mouseover', e => {
        maybeRemoveHoveredHighlight(e.target);
      });
    }

    // Save home HTML before any navigation
    homeHTML = document.getElementById('main-content').innerHTML;

    // Load the page specified in the URL, if any
    const initialPage = getCurrentPage();
    if (initialPage !== 'index.html') {
      loadPage(initialPage, false);
    } else {
      setActiveLink('index.html');
      applyHighlightsForCurrentPage('index.html');
    }

    prefetchAllPages().catch(() => {});
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        warmRenderedPages().catch(() => {});
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        warmRenderedPages().catch(() => {});
      }, 700);
    }
  });
})();
