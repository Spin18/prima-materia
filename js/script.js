(function () {
  'use strict';

  // ----- Mobile nav toggle -----
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ----- Scroll reveal -----
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // ----- Calendly popup, loaded on demand instead of on every page load -----
  var calendlyState = 'unloaded'; // unloaded -> loading -> ready (or 'failed')
  var calendlyQueue = [];

  function loadCalendly(onReady) {
    if (calendlyState === 'ready') { onReady(); return; }
    calendlyQueue.push(onReady);
    if (calendlyState === 'loading') { return; }
    calendlyState = 'loading';

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(link);

    var script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.onload = function () {
      calendlyState = 'ready';
      calendlyQueue.splice(0).forEach(function (fn) { fn(); });
    };
    script.onerror = function () {
      calendlyState = 'failed';
      calendlyQueue = [];
    };
    document.head.appendChild(script);
  }

  document.querySelectorAll('.calendly-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var url = link.href;
      loadCalendly(function () {
        window.Calendly.initPopupWidget({ url: url });
      });
    });
  });

  // ----- Hero element word-cycle -----
  var elementCycle = document.getElementById('elementCycle');
  if (elementCycle && !reduceMotion) {
    var elementWords = ['Earth.', 'Water.', 'Fire.', 'Air.', 'Ether.'];
    var elementIndex = 0;
    setInterval(function () {
      elementCycle.classList.add('is-fading');
      setTimeout(function () {
        elementIndex = (elementIndex + 1) % elementWords.length;
        elementCycle.textContent = elementWords[elementIndex];
        elementCycle.classList.remove('is-fading');
      }, 600);
    }, 4500);
  }

  // ----- Contact form (AJAX submit via FormSubmit, with plain-POST fallback) -----
  var contactForm = document.getElementById('contactForm');
  var formStatus = document.getElementById('formStatus');
  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var ajaxAction = contactForm.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

      submitBtn.disabled = true;
      formStatus.textContent = 'Sending...';
      formStatus.classList.remove('is-error');

      fetch(ajaxAction, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(contactForm)
      })
        .then(function (res) {
          if (!res.ok) { throw new Error('Request failed'); }
          formStatus.textContent = "Thank you, your message has been sent. I'll get back to you soon.";
          contactForm.reset();
        })
        .catch(function () {
          formStatus.textContent = 'Something went wrong. Please email hello@primamateriacoaching.com directly.';
          formStatus.classList.add('is-error');
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  // ----- Privacy choices modal, gates Google Analytics until accepted -----
  var CONSENT_KEY = 'pm_consent';
  var consentModal = document.getElementById('cookieBanner');
  var toggleAnalytics = document.getElementById('toggleAnalytics');
  var acceptAllBtn = document.getElementById('cookieAcceptAll');
  var rejectAllBtn = document.getElementById('cookieRejectAll');
  var confirmBtn = document.getElementById('cookieConfirm');
  var closeBtn = document.getElementById('cookieClose');
  var cookieSettingsLink = document.getElementById('cookieSettingsLink');

  function loadAnalytics() {
    if (window.gaLoaded) { return; }
    window.gaLoaded = true;
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-JVE9YP67X3';
    document.head.appendChild(gaScript);
    gtag('config', 'G-JVE9YP67X3');
  }

  function clearAnalyticsCookies() {
    var host = window.location.hostname;
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name === '_gid' || name === '_gat' || name.indexOf('_ga_') === 0) {
        var expire = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // gtag.js may have set this with an explicit Domain attribute; try every
        // variant so the deletion actually matches instead of writing a no-op.
        document.cookie = expire;
        document.cookie = expire + ' domain=' + host + ';';
        document.cookie = expire + ' domain=.' + host + ';';
      }
    });
  }

  function getStoredConsent() {
    try {
      return JSON.parse(localStorage.getItem(CONSENT_KEY));
    } catch (e) {
      return null;
    }
  }

  var storedConsent = getStoredConsent();

  function showModal(prefillAnalytics) {
    if (!consentModal) { return; }
    if (toggleAnalytics) { toggleAnalytics.checked = !!prefillAnalytics; }
    consentModal.classList.add('is-visible');
  }

  function hideModal() {
    if (consentModal) { consentModal.classList.remove('is-visible'); }
  }

  function applyConsent(analyticsGranted) {
    var wasGranted = !!(storedConsent && storedConsent.analytics);
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: analyticsGranted }));
    storedConsent = { analytics: analyticsGranted };

    if (analyticsGranted) {
      loadAnalytics();
      hideModal();
      return;
    }

    clearAnalyticsCookies();
    if (wasGranted) {
      // Analytics was already loaded this session; reload so it actually stops.
      window.location.reload();
      return;
    }
    hideModal();
  }

  if (storedConsent && storedConsent.analytics) {
    loadAnalytics();
  } else if (!storedConsent) {
    showModal(false);
  }

  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', function () { applyConsent(true); });
  }
  if (rejectAllBtn) {
    rejectAllBtn.addEventListener('click', function () { applyConsent(false); });
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      applyConsent(!!(toggleAnalytics && toggleAnalytics.checked));
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', hideModal);
  }
  if (consentModal) {
    consentModal.addEventListener('click', function (e) {
      if (e.target === consentModal) { hideModal(); }
    });
  }
  if (cookieSettingsLink) {
    cookieSettingsLink.addEventListener('click', function (e) {
      e.preventDefault();
      var current = getStoredConsent();
      showModal(current ? current.analytics : false);
    });
  }

  // ----- Footer year -----
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
