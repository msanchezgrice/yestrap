(function () {
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  var siteId = window.SITE_ID || 'site';
  var hue = hash(siteId) % 360;
  document.documentElement.style.setProperty('--accent-h', String(hue));

  var form = document.getElementById('waitlist-form');
  var status = document.getElementById('waitlist-status');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="email"]');
      var email = input ? input.value.trim() : '';
      if (!email) {
        if (status) status.textContent = 'Please enter a valid email.';
        return;
      }
      if (window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture('waitlist_submit', {
          email: email,
          site_id: siteId,
          site_name: window.SITE_NAME || siteId,
        });
      }
      if (status) status.textContent = 'Thanks! We will be in touch.';
      form.reset();
    });
  }

  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
