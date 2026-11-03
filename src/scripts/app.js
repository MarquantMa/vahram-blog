/**
 * Vahram 的 blog — Minimal Client Script
 * Instant EN/ZH toggle & chronological category filtering (Personal, Tech, Entrepreneurship)
 */

(function () {
  'use strict';

  let currentLang = 'en';
  let activeFilter = null;

  function init() {
    initLanguage();
    initFilters();
  }

  function initLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const savedLang = localStorage.getItem('vahram_lang');

    if (urlLang === 'zh' || urlLang === 'en') {
      currentLang = urlLang;
      localStorage.setItem('vahram_lang', currentLang);
    } else if (savedLang === 'zh' || savedLang === 'en') {
      currentLang = savedLang;
    } else {
      currentLang = 'en';
    }

    applyLanguage(currentLang, false);

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
    if (lang === currentLang) return;

    const docEl = document.documentElement;
    const oldScrollMax = docEl.scrollHeight - window.innerHeight;
    const scrollRatio = oldScrollMax > 0 ? window.scrollY / oldScrollMax : 0;
    const isScrolledDown = window.scrollY > 100;

    currentLang = lang;
    localStorage.setItem('vahram_lang', lang);

    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());

    applyLanguage(lang, true);

    if (isScrolledDown) {
      requestAnimationFrame(() => {
        const newScrollMax = docEl.scrollHeight - window.innerHeight;
        if (newScrollMax > 0) {
          window.scrollTo({ top: scrollRatio * newScrollMax, behavior: 'instant' });
        }
      });
    }
  }

  function applyLanguage(lang, animate) {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
    });

    document.querySelectorAll('[data-en][data-zh]').forEach((el) => {
      const text = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      if (text !== null) {
        el.textContent = text;
      }
    });

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

      const postTitleEl = document.getElementById('post-title');
      if (postTitleEl) {
        const titleText = lang === 'zh' ? postTitleEl.getAttribute('data-zh') : postTitleEl.getAttribute('data-en');
        if (titleText) {
          postTitleEl.textContent = titleText;
          document.title = `${titleText} — Vahram 的 blog`;
        }
      }
    } else {
      document.title = 'Vahram 的 blog';
    }

    document.querySelectorAll('a[href^="/posts/"], a[href="/"]').forEach((link) => {
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
    element.style.transition = 'opacity 0.2s ease';
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }

  function initFilters() {
    const filterButtons = document.querySelectorAll('.chip-btn[data-filter]');
    if (!filterButtons.length) return;

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-filter');
        if (activeFilter === selected) {
          activeFilter = null;
        } else {
          activeFilter = selected;
        }
        applyFilter();
      });
    });
  }

  function applyFilter() {
    const filterButtons = document.querySelectorAll('.chip-btn[data-filter]');
    filterButtons.forEach((btn) => {
      const isSelected = activeFilter !== null && btn.getAttribute('data-filter') === activeFilter;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    const cards = document.querySelectorAll('.story-card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
      const match = !activeFilter || cardCat === activeFilter.toLowerCase();
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    const emptyState = document.getElementById('empty-filter-state');
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
