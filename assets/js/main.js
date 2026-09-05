(function () {
  'use strict';

  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const navigation = document.getElementById('site-nav');

  const setHeaderState = () => {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 28);
    }
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const cleanAddressBar = () => {
    if (!window.location.hash) return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  cleanAddressBar();

  document.querySelectorAll('[data-scroll]').forEach((control) => {
    control.addEventListener('click', () => {
      const targetId = control.getAttribute('data-scroll');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      cleanAddressBar();
    });
  });

  const closeMenu = () => {
    if (!menuToggle || !navigation) return;
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
  };

  if (menuToggle && navigation) {
    menuToggle.addEventListener('click', () => {
      const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
      navigation.classList.toggle('is-open', willOpen);
      menuToggle.setAttribute('aria-expanded', String(willOpen));
      body.classList.toggle('menu-open', willOpen);
    });

    navigation.querySelectorAll('[data-scroll]').forEach((control) => {
      control.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) closeMenu();
    });
  }

  const dialog = document.getElementById('lightbox');
  const dialogImage = dialog ? dialog.querySelector('[data-lightbox-image]') : null;
  const dialogCaption = dialog ? dialog.querySelector('[data-lightbox-caption]') : null;
  const closeButton = dialog ? dialog.querySelector('[data-lightbox-close]') : null;
  const previousButton = dialog ? dialog.querySelector('[data-lightbox-prev]') : null;
  const nextButton = dialog ? dialog.querySelector('[data-lightbox-next]') : null;
  const sourceButtons = Array.from(document.querySelectorAll('[data-lightbox]'));
  const uniqueSources = [];
  const seenSources = new Set();

  sourceButtons.forEach((button) => {
    const source = button.getAttribute('data-lightbox');
    if (!source || seenSources.has(source)) return;
    const image = button.querySelector('img');
    seenSources.add(source);
    uniqueSources.push({
      source,
      alt: image ? image.getAttribute('alt') || '' : '',
    });
  });

  let activeIndex = 0;

  const preloadNeighbor = (index) => {
    if (!uniqueSources.length) return;
    const item = uniqueSources[(index + uniqueSources.length) % uniqueSources.length];
    const image = new Image();
    image.src = item.source;
  };

  const showImage = (index) => {
    if (!dialogImage || !dialogCaption || !uniqueSources.length) return;
    activeIndex = (index + uniqueSources.length) % uniqueSources.length;
    const item = uniqueSources[activeIndex];
    dialogImage.src = item.source;
    dialogImage.alt = item.alt;
    dialogCaption.textContent = item.alt;
    preloadNeighbor(activeIndex - 1);
    preloadNeighbor(activeIndex + 1);
  };

  const openLightbox = (source) => {
    if (!dialog) return;
    const index = uniqueSources.findIndex((item) => item.source === source);
    showImage(index >= 0 ? index : 0);
    body.classList.add('lightbox-open');
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  };

  const closeLightbox = () => {
    if (!dialog) return;
    body.classList.remove('lightbox-open');
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    if (dialogImage) dialogImage.removeAttribute('src');
  };

  sourceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      openLightbox(button.getAttribute('data-lightbox'));
    });
  });

  if (dialog) {
    if (closeButton) closeButton.addEventListener('click', closeLightbox);
    if (previousButton) previousButton.addEventListener('click', () => showImage(activeIndex - 1));
    if (nextButton) nextButton.addEventListener('click', () => showImage(activeIndex + 1));

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeLightbox();
    });

    dialog.addEventListener('close', () => {
      body.classList.remove('lightbox-open');
      if (dialogImage) dialogImage.removeAttribute('src');
    });

    dialog.addEventListener('cancel', () => {
      body.classList.remove('lightbox-open');
    });

    document.addEventListener('keydown', (event) => {
      if (!dialog.hasAttribute('open')) return;
      if (event.key === 'ArrowLeft') showImage(activeIndex - 1);
      if (event.key === 'ArrowRight') showImage(activeIndex + 1);
    });
  }
})();
