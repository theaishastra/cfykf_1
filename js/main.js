// Care for Your Kidney Foundation — site interactions
document.addEventListener('DOMContentLoaded', function () {

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    var closeMenu = function () {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      links.querySelectorAll('.nav-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
    };
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    // Tapping the dimmed backdrop (rendered behind the open mobile menu)
    // closes it — the click still bubbles to body since the backdrop
    // itself is a ::after pseudo-element, not a separate DOM node.
    document.addEventListener('click', function (e) {
      if (!document.body.classList.contains('nav-open')) return;
      if (links.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeMenu();
    });
  }

  // Grouped nav dropdowns ("Our Programs", "Research & Recognition", "Media") —
  // CSS alone opens them on desktop :hover, but touch/keyboard needs an
  // explicit toggle, so click support is added for every viewport width.
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  if (dropdowns.length) {
    var closeAllDropdowns = function (except) {
      dropdowns.forEach(function (d) {
        if (d === except) return;
        d.classList.remove('open');
        var t = d.querySelector('.nav-dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    };
    dropdowns.forEach(function (d) {
      var trigger = d.querySelector('.nav-dropdown-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = d.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(isOpen));
        closeAllDropdowns(d);
      });
    });
    document.addEventListener('click', function () { closeAllDropdowns(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllDropdowns();
    });
  }

  // Animated counters — HTML already shows the correct final value as a
  // static fallback; only swap to the animated version once we're sure
  // IntersectionObserver is supported and about to run.
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var animate = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = (decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString('en-IN')) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = (decimals ? target.toFixed(decimals) : target.toLocaleString('en-IN')) + suffix;
      }
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  }

  // Scroll reveal — arm the hidden state only right before observing.
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    reveals.forEach(function (r) { r.classList.add('reveal-armed'); });
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (r) { rio.observe(r); });
    // Safety net: force EVERY .reveal element visible after a timeout,
    // no matter its size. A missed fade-in animation is a cosmetic
    // shortfall; a section stuck invisible forever (e.g. because the
    // observer never intersects it — tall element, backgrounded tab,
    // rapid scroll) is a content-breaking bug. This does not fight the
    // observer: elements already revealed by scroll are unobserved and
    // already have .in, so re-adding it here is a harmless no-op.
    setTimeout(function () {
      reveals.forEach(function (r) { r.classList.add('in'); });
    }, 3500);
  }

  // Fading photo slideshow (home page hero image)
  document.querySelectorAll('[data-fade-slider]').forEach(function (box) {
    var slides = box.querySelectorAll('.fade-slide');
    if (slides.length < 2) return;
    var current = 0;
    setInterval(function () {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 2000);
  });

  // Horizontal auto-sliding image carousels (events page gallery sliders)
  var sliderControllers = [];
  document.querySelectorAll('.gallery-slider').forEach(function (slider) {
    if (slider.closest('.camp-gallery')) return; // camp galleries scroll continuously, handled below
    var track = slider.querySelector('.gallery-track');
    var prev = slider.querySelector('.gallery-nav.prev');
    var next = slider.querySelector('.gallery-nav.next');
    if (!track) return;

    function step(dir) {
      var card = track.firstElementChild;
      var amount = card ? card.getBoundingClientRect().width + 16 : 260;
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (dir > 0 && atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: dir * amount, behavior: 'smooth' });
      }
    }

    if (next) next.addEventListener('click', function () { step(1); });
    if (prev) prev.addEventListener('click', function () { step(-1); });

    var paused = false;
    ['mouseenter', 'touchstart', 'focusin'].forEach(function (evt) {
      track.addEventListener(evt, function () { paused = true; }, { passive: true });
    });
    ['mouseleave', 'touchend', 'focusout'].forEach(function (evt) {
      track.addEventListener(evt, function () { paused = false; }, { passive: true });
    });

    var timer = null;
    sliderControllers.push({
      slider: slider,
      start: function () { if (!timer) timer = setInterval(function () { if (!paused) step(1); }, 3200); },
      stop: function () { clearInterval(timer); timer = null; }
    });
  });
  sliderControllers.forEach(function (c) { c.start(); });

  // Camp galleries (screenings page): continuous scroll, same technique as the home page marquee
  document.querySelectorAll('.camp-gallery .gallery-slider').forEach(function (slider) {
    var track = slider.querySelector('.gallery-track');
    if (!track) return;

    var originalWidth = track.scrollWidth;
    Array.prototype.slice.call(track.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });

    var pxPerSecond = 42; // matches the home page marquee's pace
    track.style.animationDuration = Math.max(originalWidth / pxPerSecond, 18) + 's';
  });

  // Lightbox for gallery images
  var lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img alt="">';
  document.body.appendChild(lightbox);
  var lbImg = lightbox.querySelector('img');
  function openLightbox(src, alt) {
    lbImg.src = src; lbImg.alt = alt || '';
    lightbox.classList.add('open');
  }
  lightbox.addEventListener('click', function (e) {
    if (e.target !== lbImg) lightbox.classList.remove('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') lightbox.classList.remove('open');
  });
  document.querySelectorAll('[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var img = a.querySelector('img');
      openLightbox(a.getAttribute('href') || (img && img.src), img && img.alt);
    });
  });

  // Contact form — submits to FormBold via fetch so the page never leaves the site.
  var form = document.querySelector('.form form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.querySelector('.btn-text') || btn;
      var original = label.textContent;
      btn.disabled = true;
      label.textContent = 'Sending…';

      fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          label.textContent = 'Message sent — thank you!';
          form.reset();
        })
        .catch(function () {
          label.textContent = 'Something went wrong — please email us directly';
        })
        .finally(function () {
          setTimeout(function () { label.textContent = original; btn.disabled = false; }, 3200);
        });
    });
  }
});
