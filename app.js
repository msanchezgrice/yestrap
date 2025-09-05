// Waitlist form handling (front-end only).
// This adds basic validation UX and a friendly success message.
// To connect to a real provider later (Netlify, Formspree, etc.), set the form's action URL.

function bindForm(id) {
  const form = document.getElementById(id);
  if (!form) return;
  const emailInput = form.querySelector('input[type="email"]');
  const message = form.querySelector('.status');

  form.addEventListener('submit', async (e) => {
    const email = emailInput.value.trim();
    message.textContent = '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.textContent = 'Please enter a valid email address.';
      message.style.color = '#ffd15a';
      emailInput.focus();
      return;
    }

    const actionAttr = form.getAttribute('action') || '';
    const hasExplicitAction = actionAttr.trim().length > 0;
    const isRemoteHttpAction = /^https?:\/\//i.test(actionAttr);
    const isNetlifyHost = /netlify/i.test(window.location.hostname);
    const isNetlifyForm = form.hasAttribute('data-netlify');

    // If hosted on Netlify and using Netlify forms without an explicit action,
    // let the native submission happen so Netlify can capture it.
    const allowNativeNetlifySubmit = isNetlifyHost && isNetlifyForm && !hasExplicitAction;

    if (!allowNativeNetlifySubmit) {
      e.preventDefault();
    }

    if (allowNativeNetlifySubmit) {
      // Fall through to native submit; do not handle via fetch/local.
      return;
    }

    try {
      // If Vercel serverless is available, prefer it
      const sameOriginApi = '/api/subscribe';
      const canCallSameOrigin = !!(window && window.location && window.fetch);

      if (canCallSameOrigin) {
        const res = await fetch(sameOriginApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Network');
      } else if (isRemoteHttpAction) {
        const res = await fetch(form.action, {
          method: form.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Network');
      } else {
        // Local friendly success for now.
        const key = 'yestrap_waitlist_local';
        const bag = JSON.parse(localStorage.getItem(key) || '[]');
        bag.push({ email, at: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(bag));
      }
      form.reset();
      message.textContent = "You're on the list. We'll email you at launch.";
      message.style.color = '#10b981';
    } catch (err) {
      message.textContent = 'Oops, something went wrong. Please try again later.';
      message.style.color = '#ffd15a';
      console.error(err);
    }
  });
}

['waitlist', 'waitlist-bottom'].forEach(bindForm);
