/**
 * Vahram's Blog - Core Client Script
 * Apple Newsroom Style Interactivity & Instant Bilingual Switching
 */

(function () {
  'use strict';

  // State
  let currentLang = 'en';
  let postsIndex = null;
  let selectedSearchIndex = -1;

  // Initialize
  function init() {
    initTheme();
    initLanguage();
    initSearch();
    initReadingProgress();
    initCodeCopyButtons();
    initShareButtons();
  }

  /* ==========================================================================
     Theme Management (Apple Light / Dark)
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem('vahram_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(initialTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('vahram_theme', newTheme);
      });
    }

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('vahram_theme')) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      }
    }
  }

  /* ==========================================================================
     One-Click Bilingual Switcher (一键双语切换)
     ========================================================================== */
  function initLanguage() {
    // 1. Check URL param ?lang=zh or ?lang=en
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const savedLang = localStorage.getItem('vahram_lang');

    if (urlLang === 'zh' || urlLang === 'en') {
      currentLang = urlLang;
    } else if (savedLang === 'zh' || savedLang === 'en') {
      currentLang = savedLang;
    } else {
      // Auto-detect browser language if first visit
      const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      currentLang = browserLang.startsWith('zh') ? 'zh' : 'en';
    }

    applyLanguage(currentLang, false);

    // Bind all language toggle buttons
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLang = btn.getAttribute('data-lang-btn');
        if (targetLang && targetLang !== currentLang) {
          switchLanguage(targetLang);
        }
      });
    });
  }

  function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('vahram_lang', lang);

    // Update URL query parameter without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());

    applyLanguage(lang, true);
  }

  function applyLanguage(lang, animate) {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

    // 1. Update all language buttons visual active state
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      if (btn.getAttribute('data-lang-btn') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 2. Update inline bilingual texts (marked with data-en and data-zh)
    document.querySelectorAll('[data-en][data-zh]').forEach((el) => {
      const text = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      if (text !== null) {
        el.textContent = text;
      }
    });

    // 3. Update input placeholders
    document.querySelectorAll('[data-placeholder-en][data-placeholder-zh]').forEach((el) => {
      const placeholder = lang === 'zh' ? el.getAttribute('data-placeholder-zh') : el.getAttribute('data-placeholder-en');
      if (placeholder !== null) {
        el.setAttribute('placeholder', placeholder);
      }
    });

    // 4. Update Article Page specific blocks
    const contentEn = document.getElementById('post-content-en');
    const contentZh = document.getElementById('post-content-zh');

    if (contentEn && contentZh) {
      if (lang === 'zh') {
        contentEn.style.display = 'none';
        contentZh.style.display = 'block';
        if (animate) triggerFadeIn(contentZh);
      } else {
        contentZh.style.display = 'none';
        contentEn.style.display = 'block';
        if (animate) triggerFadeIn(contentEn);
      }

      // Update page title if article has bilingual titles
      const postTitleEl = document.getElementById('post-title');
      if (postTitleEl) {
        const titleText = lang === 'zh' ? postTitleEl.getAttribute('data-zh') : postTitleEl.getAttribute('data-en');
        if (titleText) {
          postTitleEl.textContent = titleText;
          document.title = `${titleText} — Vahram's Blog`;
        }
      }
    }

    // 5. Update article links to carry the current language
    document.querySelectorAll('a[href^="/posts/"], a[href*="/posts/"]').forEach((link) => {
      try {
        const linkUrl = new URL(link.getAttribute('href'), window.location.origin);
        linkUrl.searchParams.set('lang', lang);
        link.setAttribute('href', linkUrl.pathname + linkUrl.search);
      } catch (e) {
        // Ignore malformed hrefs
      }
    });
  }

  function triggerFadeIn(element) {
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.25s ease-in-out';
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }

  /* ==========================================================================
     Spotlight Search Modal (⌘K / Ctrl+K)
     ========================================================================== */
  function initSearch() {
    const searchModal = document.getElementById('search-modal-backdrop');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchTriggers = document.querySelectorAll('.search-trigger-btn, [data-search-trigger]');

    if (!searchModal || !searchInput) return;

    // Load search index
    async function loadSearchIndex() {
      if (postsIndex) return;
      try {
        const res = await fetch('/api/posts.json');
        if (res.ok) {
          postsIndex = await res.json();
        }
      } catch (err) {
        console.warn('Could not load search index:', err);
      }
    }

    function openSearch() {
      searchModal.classList.add('open');
      searchInput.value = '';
      selectedSearchIndex = -1;
      loadSearchIndex().then(() => renderSearchResults(''));
      setTimeout(() => searchInput.focus(), 50);
    }

    function closeSearch() {
      searchModal.classList.remove('open');
    }

    // Triggers
    searchTriggers.forEach((btn) => btn.addEventListener('click', openSearch));

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchModal.classList.contains('open')) closeSearch();
        else openSearch();
      } else if (e.key === 'Escape' && searchModal.classList.contains('open')) {
        closeSearch();
      }
    });

    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });

    // Live search input
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value.trim());
    });

    // Arrow navigation
    searchInput.addEventListener('keydown', (e) => {
      const items = searchResults.querySelectorAll('.search-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSearchIndex = (selectedSearchIndex + 1) % items.length;
        updateSelectedSearchItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSearchIndex = (selectedSearchIndex - 1 + items.length) % items.length;
        updateSelectedSearchItem(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSearchIndex >= 0 && items[selectedSearchIndex]) {
          items[selectedSearchIndex].click();
        }
      }
    });

    function renderSearchResults(query) {
      if (!searchResults || !postsIndex) return;
      selectedSearchIndex = -1;

      const q = query.toLowerCase();
      const filtered = postsIndex.filter((post) => {
        if (!q) return true; // show all recent if query empty
        return (
          (post.title && post.title.toLowerCase().includes(q)) ||
          (post.title_zh && post.title_zh.toLowerCase().includes(q)) ||
          (post.summary && post.summary.toLowerCase().includes(q)) ||
          (post.summary_zh && post.summary_zh.toLowerCase().includes(q)) ||
          (post.category && post.category.toLowerCase().includes(q)) ||
          (post.category_zh && post.category_zh.toLowerCase().includes(q)) ||
          (post.tags && post.tags.some((t) => t.toLowerCase().includes(q)))
        );
      });

      if (filtered.length === 0) {
        const noResultText = currentLang === 'zh' ? '未找到相关文章' : 'No matching stories found';
        searchResults.innerHTML = `<li class="search-empty-state">${noResultText}</li>`;
        return;
      }

      searchResults.innerHTML = filtered
        .slice(0, 8)
        .map((post, idx) => {
          const displayTitle = currentLang === 'zh' && post.title_zh ? post.title_zh : post.title;
          const displayCat = currentLang === 'zh' && post.category_zh ? post.category_zh : post.category;
          return `
          <li class="search-item ${idx === 0 ? 'selected' : ''}" data-url="/posts/${post.slug}/?lang=${currentLang}">
            <div class="search-item-title">${escapeHtml(displayTitle)}</div>
            <div class="search-item-meta">
              <span>${escapeHtml(displayCat)}</span>
              <span>•</span>
              <span>${post.date}</span>
            </div>
          </li>
        `;
        })
        .join('');

      searchResults.querySelectorAll('.search-item').forEach((item) => {
        item.addEventListener('click', () => {
          const url = item.getAttribute('data-url');
          if (url) window.location.href = url;
        });
      });
    }

    function updateSelectedSearchItem(items) {
      items.forEach((item, idx) => {
        if (idx === selectedSearchIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  /* ==========================================================================
     Reading Progress Indicator
     ========================================================================== */
  function initReadingProgress() {
    const progressBar = document.getElementById('reading-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const progress = (window.scrollY / docHeight) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }, { passive: true });
  }

  /* ==========================================================================
     macOS Code Snippet Copy Action
     ========================================================================== */
  function initCodeCopyButtons() {
    document.querySelectorAll('.copy-code-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const codeBlock = btn.closest('.code-block');
        if (!codeBlock) return;
        const codeEl = codeBlock.querySelector('code');
        if (!codeEl) return;

        try {
          await navigator.clipboard.writeText(codeEl.innerText);
          const origText = btn.innerHTML;
          btn.textContent = currentLang === 'zh' ? '已复制!' : 'Copied!';
          setTimeout(() => {
            btn.innerHTML = origText;
          }, 2000);
        } catch (err) {
          console.warn('Clipboard copy failed:', err);
        }
      });
    });
  }

  /* ==========================================================================
     Share & Toast Notification
     ========================================================================== */
  function initShareButtons() {
    const copyLinkBtn = document.getElementById('copy-article-link-btn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast(currentLang === 'zh' ? '链接已成功复制到剪贴板' : 'Article link copied to clipboard');
        } catch (err) {
          console.warn('Failed to copy link:', err);
        }
      });
    }
  }

  function showToast(message) {
    let toast = document.getElementById('site-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'site-toast';
      toast.className = 'toast-box';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Category filter on index page
  window.filterCategory = function (category, btn) {
    document.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const cards = document.querySelectorAll('.story-card');
    cards.forEach((card) => {
      const cardCategory = card.getAttribute('data-category');
      if (category === 'all' || cardCategory === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
