// Waitlist form handling (front-end only).
// This adds basic validation UX and a friendly success message.
// To connect to a real provider later (Netlify, Formspree, etc.), set the form's action URL.

function bindForm(id) {
  const form = document.getElementById(id);
  if (!form) return;
  const emailInput = form.querySelector('input[type="email"]');
  const message = form.querySelector('.status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    message.textContent = '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.textContent = 'Please enter a valid email address.';
      message.style.color = '#ffd15a';
      emailInput.focus();
      return;
    }

    try {
      // If you later add a real endpoint, set form.action = 'https://...'
      if (form.action && form.action.startsWith('http')) {
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
