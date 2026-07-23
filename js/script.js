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

  // ----- Calendly popup (progressive enhancement over plain links) -----
  document.querySelectorAll('.calendly-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.Calendly) {
        e.preventDefault();
        window.Calendly.initPopupWidget({ url: link.href });
      }
      // if Calendly widget script hasn't loaded, the link falls through
      // and opens calendly.com directly in a new tab.
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

  // ----- Footer year -----
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
