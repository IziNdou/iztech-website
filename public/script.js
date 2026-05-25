/* ══════════════════════════════════════════════════════
   IZTECH Website — script.js
   ══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Scroll-triggered Nav ──────────────────────────
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── Mobile Nav Toggle ─────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');
  navToggle.addEventListener('click', () => {
    navMobile.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    const isOpen = navMobile.classList.contains('open');
    spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
    spans[1].style.opacity  = isOpen ? '0' : '';
    spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
  });

  // Close mobile nav when a link is clicked
  navMobile.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      navMobile.classList.remove('open');
      navToggle.querySelectorAll('span').forEach(s => {
        s.style.transform = '';
        s.style.opacity = '';
      });
    });
  });

  // ─── Intersection Observer — Reveal Animations ─────
  const revealEls = document.querySelectorAll('.reveal, .reveal-line');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Keep observing so re-entry works on scroll-up
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  revealEls.forEach(el => observer.observe(el));

  // Hero elements trigger immediately (above fold)
  document.querySelectorAll('.hero .reveal, .hero .reveal-line').forEach(el => {
    setTimeout(() => el.classList.add('visible'), 100);
  });

  // ─── Active Nav Highlight on Scroll ────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}`
            ? 'var(--accent)'
            : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  // ─── Contact Form Submission ────────────────────────
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const feedback = document.getElementById('formFeedback');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      feedback.className = 'form-feedback';
      feedback.style.display = 'none';

      // Gather data
      const data = {
        name:    form.name.value.trim(),
        email:   form.email.value.trim(),
        company: form.company.value.trim(),
        service: form.service.value,
        message: form.message.value.trim(),
      };

      // Client-side validation
      if (!data.name || !data.email || !data.message) {
        showFeedback('error', '⚠ Please fill in all required fields (Name, Email, Message).');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        showFeedback('error', '⚠ Please enter a valid email address.');
        return;
      }

      // Show loading
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const res = await fetch('https://us-central1-iztech-d145d.cloudfunctions.net/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (result.success) {
          showFeedback('success', '✓ Message sent! We\'ll be in touch soon.');
          form.reset();
        } else {
          showFeedback('error', result.message || 'Something went wrong. Please try again.');
        }
      } catch (err) {
        showFeedback('error', 'Network error. Please email us directly at Izindou@Iztech.co.za');
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  }

  function showFeedback(type, message) {
    feedback.textContent = message;
    feedback.className = `form-feedback ${type}`;
    feedback.style.display = 'block';
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ─── Smooth Scroll for Anchor Links ────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80; // nav height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── Stats Counter Animation ───────────────────────
  const statNumbers = document.querySelectorAll('.stat-number');
  let statAnimated = false;

  const statsObserver = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting) && !statAnimated) {
      statAnimated = true;
      statNumbers.forEach(el => {
        const text = el.textContent;
        const match = text.match(/(\d+)/);
        if (!match) return;
        const target = parseInt(match[1]);
        const suffix = text.replace(/\d+/, '');
        let current = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          current = Math.min(current + Math.ceil(step), target);
          el.textContent = current + suffix;
          if (current >= target) clearInterval(timer);
        }, 35);
      });
    }
  }, { threshold: 0.5 });

  document.querySelector('.stats-bar') && statsObserver.observe(document.querySelector('.stats-bar'));

  // ─── Subtle cursor glow on desktop ─────────────────
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9999;
      width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,229,190,0.04) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      transition: opacity 0.3s;
      top: 0; left: 0;
    `;
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    (function animate() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      glow.style.left = curX + 'px';
      glow.style.top  = curY + 'px';
      requestAnimationFrame(animate);
    })();
  }

});
