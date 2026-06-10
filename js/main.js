/**
 * VakilAI — Main JavaScript
 * Premium dark SaaS landing page interactions
 */

'use strict';

/* ============================================================
   1. SCROLL PROGRESS BAR
   ============================================================ */
const scrollProgress = document.getElementById('scrollProgress');

function updateScrollProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = pct + '%';
}

/* ============================================================
   2. ANNOUNCEMENT BAR DISMISS
   ============================================================ */
const announcementBar = document.getElementById('announcementBar');
const announcementClose = document.getElementById('announcementClose');

function initAnnouncementBar() {
  if (!announcementBar) return;

  // Restore dismissed state from sessionStorage
  if (sessionStorage.getItem('vakilai_ann_dismissed') === '1') {
    announcementBar.classList.add('dismissed');
    updateNavbarTop();
  }

  announcementClose?.addEventListener('click', () => {
    announcementBar.classList.add('dismissed');
    sessionStorage.setItem('vakilai_ann_dismissed', '1');
    updateNavbarTop();
  });
}

function updateNavbarTop() {
  // CSS handles this via sibling selector; just trigger reflow
}

/* ============================================================
   3. NAVBAR — SCROLL GLASS EFFECT
   ============================================================ */
const navbar = document.getElementById('navbar');

function initNavbar() {
  if (!navbar) return;

  function onScroll() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateScrollProgress();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   4. MOBILE HAMBURGER MENU
   ============================================================ */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const overlay = document.getElementById('mobileOverlay');

  if (!hamburger || !navLinks) return;

  function openMenu() {
    hamburger.classList.add('active');
    navLinks.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.contains('active') ? closeMenu() : openMenu();
  });

  overlay?.addEventListener('click', closeMenu);

  // Close on nav link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

/* ============================================================
   5. SMOOTH SCROLL
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      const annH = announcementBar && !announcementBar.classList.contains('dismissed')
        ? announcementBar.offsetHeight
        : 0;
      const offset = navH + annH;

      const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   6. REVEAL ANIMATIONS (IntersectionObserver)
   ============================================================ */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -48px 0px'
  });

  items.forEach(el => observer.observe(el));
}

/* ============================================================
   7. FAQ ACCORDION
   ============================================================ */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ============================================================
   8. WAITLIST FORM — Validation + Mailto fallback + Success
   ============================================================ */
function initWaitlistForm() {
  const form = document.getElementById('waitlistForm');
  const successEl = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('wlSubmit');
  if (!form) return;

  function getField(id) { return document.getElementById(id); }
  function getError(id) { return document.getElementById(id); }

  function showError(inputEl, errorEl, msg) {
    inputEl?.classList.add('error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }
  }

  function clearError(inputEl, errorEl) {
    inputEl?.classList.remove('error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }

  function validate() {
    let valid = true;

    const nameEl = getField('wlName');
    const emailEl = getField('wlEmail');
    const companyEl = getField('wlCompany');
    const roleEl = getField('wlRole');

    // Name
    clearError(nameEl, getError('nameError'));
    if (!nameEl?.value.trim()) {
      showError(nameEl, getError('nameError'), 'Please enter your name.');
      valid = false;
    } else if (nameEl.value.trim().length < 2) {
      showError(nameEl, getError('nameError'), 'Name must be at least 2 characters.');
      valid = false;
    }

    // Email
    clearError(emailEl, getError('emailError'));
    if (!emailEl?.value.trim()) {
      showError(emailEl, getError('emailError'), 'Please enter your email address.');
      valid = false;
    } else if (!validateEmail(emailEl.value)) {
      showError(emailEl, getError('emailError'), 'Please enter a valid email address.');
      valid = false;
    }

    // Company
    clearError(companyEl, getError('companyError'));
    if (!companyEl?.value.trim()) {
      showError(companyEl, getError('companyError'), 'Please enter your company name.');
      valid = false;
    }

    // Role
    clearError(roleEl, getError('roleError'));
    if (!roleEl?.value) {
      showError(roleEl, getError('roleError'), 'Please select your role.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');

    // Show loading
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-flex';
    if (submitBtn) submitBtn.disabled = true;

    const formData = {
      name: getField('wlName')?.value.trim(),
      email: getField('wlEmail')?.value.trim(),
      company: getField('wlCompany')?.value.trim(),
      role: getField('wlRole')?.value,
    };

    // Simulate async submission (replace with real API call)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mailto fallback — compose a structured email
    const subject = encodeURIComponent(`VakilAI Waitlist: ${formData.name} from ${formData.company}`);
    const body = encodeURIComponent(
      `New VakilAI Early Access Request\n\n` +
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Company: ${formData.company}\n` +
      `Role: ${formData.role}\n\n` +
      `Submitted at: ${new Date().toISOString()}`
    );
    window.location.href = `mailto:hello@adeyas.in?subject=${subject}&body=${body}`;

    // Show success state
    setTimeout(() => {
      form.style.display = 'none';
      if (successEl) successEl.style.display = 'block';
    }, 400);
  });

  // Live clear errors on input
  ['wlName', 'wlEmail', 'wlCompany', 'wlRole'].forEach(id => {
    const el = getField(id);
    const errId = id.replace('wl', '').toLowerCase() + 'Error';
    // map correctly
    const errMap = { wlName: 'nameError', wlEmail: 'emailError', wlCompany: 'companyError', wlRole: 'roleError' };
    el?.addEventListener('input', () => clearError(el, getError(errMap[id])));
    el?.addEventListener('change', () => clearError(el, getError(errMap[id])));
  });
}

/* ============================================================
   9. COUNTER ANIMATION
   ============================================================ */
function initCounters() {
  const counters = document.querySelectorAll('[data-count], .counter-num[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);

      const el = entry.target;
      const isTarget = el.hasAttribute('data-target');
      const target = parseInt(isTarget ? el.dataset.target : el.dataset.count, 10);
      const duration = 1800;
      const start = performance.now();
      const startVal = 0;

      function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
      }

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(startVal + easeOutQuart(progress) * (target - startVal));
        el.textContent = current.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString('en-IN');
      }

      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ============================================================
   10. CANVAS PARTICLE SYSTEM (Hero)
   ============================================================ */
function initParticles() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles, mouse, animId;

  mouse = { x: -9999, y: -9999, radius: 140 };

  class Particle {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.size = Math.random() * 1.4 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = -(Math.random() * 0.6 + 0.2);
      this.opacity = Math.random() * 0.5 + 0.1;
      this.fadeIn = 0;
      this.life = Math.random() * 300 + 200;
      this.age = init ? Math.floor(Math.random() * this.life) : 0;

      // Colour palette: violet / cyan / gold
      const palette = [
        `rgba(167,139,250,${this.opacity})`,
        `rgba(6,182,212,${this.opacity * 0.7})`,
        `rgba(251,191,36,${this.opacity * 0.6})`,
        `rgba(255,255,255,${this.opacity * 0.4})`,
      ];
      this.color = palette[Math.floor(Math.random() * palette.length)];
    }

    update() {
      this.age++;
      if (this.age > this.life) { this.reset(); return; }

      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * force * 2;
        this.y += Math.sin(angle) * force * 2;
      }

      this.x += this.speedX;
      this.y += this.speedY;
    }

    draw() {
      const lifeRatio = this.age / this.life;
      const alpha = lifeRatio < 0.1
        ? lifeRatio / 0.1
        : lifeRatio > 0.8
        ? 1 - (lifeRatio - 0.8) / 0.2
        : 1;

      ctx.save();
      ctx.globalAlpha = alpha * this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((W * H) / 8000), 180);
    particles = Array.from({ length: count }, () => new Particle());
  }

  function drawConnections() {
    const maxDist = 100;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.07;
          ctx.save();
          ctx.strokeStyle = `rgba(124,58,237,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  init();
  loop();

  window.addEventListener('resize', () => { resize(); init(); }, { passive: true });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });
}

/* ============================================================
   11. MAGNETIC BUTTON EFFECTS
   ============================================================ */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.magnetic-btn');
  const isMobile = () => window.innerWidth <= 768;

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      if (isMobile()) return;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const maxMove = 8;
      const moveX = Math.max(-maxMove, Math.min(maxMove, dx * 0.25));
      const moveY = Math.max(-maxMove, Math.min(maxMove, dy * 0.25));
      btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });
}

/* ============================================================
   12. CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  if (window.innerWidth <= 768) return; // disable on mobile

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  }, { passive: true });

  function animateRing() {
    // Lag the ring for a smooth trailing effect
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Scale dot on clickable elements
  const interactiveSelector = 'a, button, input, select, textarea, label, [role="button"]';
  document.querySelectorAll(interactiveSelector).forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.style.width = '10px';
      dot.style.height = '10px';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.width = '6px';
      dot.style.height = '6px';
    });
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
}

/* ============================================================
   13. HERO VISUAL CARD FLOAT ANIMATION
   ============================================================ */
function initCardFloat() {
  const cards = document.querySelectorAll('.hero-card');
  if (!cards.length) return;

  cards.forEach((card, i) => {
    const duration = 3000 + i * 700;
    const delay = i * 400;
    const amplitude = 6 + i * 2;
    let start = null;

    const baseTransform = [
      'translate(0, 0)',
      'translate(0, 0)',
      'translate(0, 0)',
      'translate(0, 0)',
    ][i] || 'translate(0, 0)';

    function animate(ts) {
      if (!start) start = ts + delay;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(animate); return; }

      const yOffset = Math.sin((elapsed / duration) * Math.PI * 2) * amplitude;
      const xOffset = Math.cos((elapsed / duration) * Math.PI * 2) * (amplitude * 0.4);

      // Preserve the :hover transform from CSS by only applying when not hovered
      if (!card.matches(':hover')) {
        card.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  });
}

/* ============================================================
   14. SCORE BAR ANIMATION
   ============================================================ */
function initScoreBar() {
  const fill = document.querySelector('.score-fill');
  if (!fill) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate from 0 to target
        fill.style.width = '0%';
        setTimeout(() => { fill.style.width = '78%'; }, 200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  observer.observe(fill);
}

/* ============================================================
   15. PRICING PRICE FORMAT (with thousand separators)
   ============================================================ */
function formatPrices() {
  document.querySelectorAll('.price-amount').forEach(el => {
    const val = parseInt(el.dataset.count || el.textContent.replace(/,/g, ''), 10);
    if (!isNaN(val)) el.textContent = val.toLocaleString('en-IN');
  });
}

/* ============================================================
   16. STICKY NAV ACTIVE LINK HIGHLIGHTING
   ============================================================ */
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0
  });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   INIT — run everything on DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initAnnouncementBar();
  initNavbar();
  initHamburger();
  initSmoothScroll();
  initReveal();
  initFAQ();
  initWaitlistForm();
  initCounters();
  initParticles();
  initMagneticButtons();
  initCursor();
  initCardFloat();
  initScoreBar();
  formatPrices();
  initActiveNavLinks();
});

/* Scroll event listener (single, batched) */
window.addEventListener('scroll', updateScrollProgress, { passive: true });
