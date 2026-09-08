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

  const createGalleryButton = (source, alt, duplicate) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    button.type = 'button';
    button.className = 'image-button';
    button.setAttribute('data-lightbox', source);
    if (duplicate) button.tabIndex = -1;
    image.src = source;
    image.alt = duplicate ? '' : alt;
    image.loading = 'lazy';
    button.appendChild(image);
    return button;
  };

  const gallerySources = (gallery) => {
    const prefix = gallery.getAttribute('data-gallery-prefix') || '';
    const count = Number.parseInt(gallery.getAttribute('data-gallery-count') || '0', 10);
    return Array.from({ length: count }, (_, index) => {
      return `assets/images/${prefix}-${String(index + 1).padStart(3, '0')}.jpg`;
    });
  };

  document.querySelectorAll('[data-gallery-prefix]').forEach((gallery) => {
    const alt = gallery.getAttribute('data-gallery-alt') || '';
    const sources = gallerySources(gallery);

    if (gallery.hasAttribute('data-marquee')) {
      const track = document.createElement('div');
      track.className = 'marquee-track';

      [false, true].forEach((duplicate) => {
        const group = document.createElement('div');
        group.className = 'marquee-group';
        if (duplicate) group.setAttribute('aria-hidden', 'true');
        sources.forEach((source) => group.appendChild(createGalleryButton(source, alt, duplicate)));
        track.appendChild(group);
      });

      gallery.appendChild(track);
      return;
    }

    sources.forEach((source) => gallery.appendChild(createGalleryButton(source, alt, false)));
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const marqueeSpeed = (gallery) => {
    if (gallery.closest('.results-gallery')) return 48;
    if (gallery.closest('.customer-gallery')) return 40;
    if (gallery.classList.contains('review-marquee')) return 34;
    return 38;
  };

  document.querySelectorAll('[data-marquee]').forEach((gallery) => {
    const track = gallery.querySelector('.marquee-track');
    const firstGroup = track ? track.querySelector('.marquee-group') : null;
    if (!track || !firstGroup) return;

    let visible = false;
    let paused = false;
    let resumeTimer = 0;
    let previousTime = performance.now();

    const pauseTemporarily = () => {
      paused = true;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { paused = false; }, 1400);
    };

    gallery.addEventListener('pointerdown', pauseTemporarily, { passive: true });
    gallery.addEventListener('pointerup', pauseTemporarily, { passive: true });
    gallery.addEventListener('pointercancel', pauseTemporarily, { passive: true });
    gallery.addEventListener('mouseenter', () => { paused = true; });
    gallery.addEventListener('mouseleave', () => { paused = false; });
    gallery.addEventListener('focusin', () => { paused = true; });
    gallery.addEventListener('focusout', () => { paused = false; });

    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
      }, { rootMargin: '250px 0px' });
      visibilityObserver.observe(gallery);
    } else {
      visible = true;
    }

    const move = (currentTime) => {
      const elapsed = Math.min((currentTime - previousTime) / 1000, 0.1);
      previousTime = currentTime;

      if (visible && !paused && !reducedMotion.matches) {
        const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
        const loopWidth = firstGroup.getBoundingClientRect().width + gap;
        if (loopWidth > 0) {
          gallery.scrollLeft += marqueeSpeed(gallery) * elapsed;
          if (gallery.scrollLeft >= loopWidth) gallery.scrollLeft -= loopWidth;
        }
      }

      window.requestAnimationFrame(move);
    };

    gallery.setAttribute('data-motion-carousel', 'ready');
    window.requestAnimationFrame(move);
  });

  document.querySelectorAll('[data-autoplay-video]').forEach((video) => {
    video.muted = true;
    video.loop = true;

    const startPlayback = () => {
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {});
      }
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            startPlayback();
          } else {
            video.pause();
          }
        });
      }, { threshold: [0, 0.45, 1] });
      observer.observe(video);
    } else {
      startPlayback();
    }
  });

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
