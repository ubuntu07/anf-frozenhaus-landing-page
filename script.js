/* =========================================================
   Structure:
     1. Config & constants
     2. Tiny DOM helpers
     3. Feature: theme
     4. Feature: router / nav / scroll
     5. Feature: parallax
     6. Feature: snow
     7. Feature: scroll reveal
     8. Feature: chatbot (pure logic + UI)
     9. Feature: ask-price
     10. Public HTML bridge
     11. Boot
   ========================================================= */

/* ---------- 1. CONFIG ---------- */
const CONFIG = {
  navScrollThreshold: 60,
  heroParallaxRate:   0.42,
  cardParallaxRate:   0.35,
  cardParallaxDepthX: 16,
  cardParallaxDepthY: 12,
  parallaxEase:       0.07,
  snowCount:          18,
  snowIcons:          ['fa-snowflake', 'fa-asterisk', 'fa-star'],
  revealThreshold:    0.12,
  revealRootMargin:   '0px 0px -50px 0px',
  botThinkMinMs:      900,
  botThinkJitterMs:   700,
  chatFocusDelayMs:   320,
};

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const THEME_KEY = 'theme';

/* ---------- 2. DOM HELPERS ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Add listener only if element exists. Returns el for chaining. */
function on(el, event, handler, opts) {
  if (el) el.addEventListener(event, handler, opts);
  return el;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- 3. THEME ---------- */
const Theme = (() => {
  const root = document.documentElement;

  function readStored() {
    try { return localStorage.getItem(THEME_KEY); }
    catch { return null; }
  }

  function preferSystem() {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    return mq?.matches ? 'dark' : 'light';
  }

  function resolveInitial() {
    const saved = readStored();
    if (saved === 'dark' || saved === 'light') return saved;
    return preferSystem();
  }

  function apply(theme) {
    const isDark = theme === 'dark';
    if (isDark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    const toggle = $('#themeToggle');
    const icon = toggle?.querySelector('i');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if (toggle) toggle.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  function init() {
    // Anti-flash: apply before paint — call as early as possible.
    apply(resolveInitial());

    const toggle = $('#themeToggle');
    on(toggle, 'click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    });
  }

  return { init, apply, resolveInitial };
})();

// Anti-flash bootstrap (run immediately, before DOM ready).
(function antiFlashTheme() {
  try {
    if (localStorage.getItem(THEME_KEY) === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch { /* ignore */ }
})();

/* ---------- 4. ROUTER + NAV + SCROLL PROGRESS ---------- */
const Router = (() => {
  const nav = $('#nav');
  const progress = $('#scrollProgress');

  function showPage(name) {
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $('#page-' + name);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateNav();
    Reveal.refresh();
  }

  function goProducts() {
    showPage('home');
    setTimeout(() => {
      $('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function updateNav() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > CONFIG.navScrollThreshold);

    if (progress) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
      progress.style.width = pct + '%';
    }
  }

  function init() {
    on(window, 'scroll', updateNav, { passive: true });
    on(window, 'resize', updateNav);
    updateNav();
  }

  return { init, showPage, goProducts, updateNav };
})();

/* ---------- 5. PARALLAX ---------- */
const Parallax = (() => {
  const heroBg = $('#heroBg');

  function initHero() {
    if (!heroBg || REDUCE_MOTION) return;
    let ticking = false;

    on(window, 'scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.3) {
          heroBg.style.transform =
            `translate3d(0,${y * CONFIG.heroParallaxRate}px,0) scale(1.05)`;
        }
        ticking = false;
      });
    }, { passive: true });
  }

  function initCards() {
    const els = $$('[data-parallax]');
    if (!els.length || REDUCE_MOTION) return;

    let mx = 0, my = 0, tx = 0, ty = 0;

    on(document, 'mousemove', (e) => {
      tx = (e.clientX - window.innerWidth / 2)  / (window.innerWidth  / 2);
      ty = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    });

    function frame() {
      mx += (tx - mx) * CONFIG.parallaxEase;
      my += (ty - my) * CONFIG.parallaxEase;
      const sc = window.scrollY;

      els.forEach(el => {
        const rate  = parseFloat(el.dataset.parallax) || 0.1;
        const depth = parseFloat(el.dataset.depth)    || 1;
        const x = mx * CONFIG.cardParallaxDepthX * depth;
        const y = my * CONFIG.cardParallaxDepthY * depth - sc * rate * CONFIG.cardParallaxRate;
        el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  function init() {
    initHero();
    initCards();
  }

  return { init };
})();

/* ---------- 6. SNOW ---------- */
const Snow = (() => {
  function init() {
    const snow = $('#snow');
    if (!snow || REDUCE_MOTION) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < CONFIG.snowCount; i++) {
      const el = document.createElement('i');
      const icon = CONFIG.snowIcons[Math.floor(Math.random() * CONFIG.snowIcons.length)];
      el.className = `fa-solid ${icon}`;
      el.style.left            = `${Math.random() * 100}%`;
      el.style.fontSize        = `${8 + Math.random() * 14}px`;
      el.style.animationDuration = `${9 + Math.random() * 12}s`;
      el.style.animationDelay    = `${Math.random() * 12}s`;
      el.style.opacity           = (0.25 + Math.random() * 0.4).toFixed(2);
      frag.appendChild(el);
    }
    snow.appendChild(frag);
  }

  return { init };
})();

/* ---------- 7. SCROLL REVEAL ---------- */
const Reveal = (() => {
  let observer;

  function addAll(items) {
    items.forEach(el => el.classList.add('in'));
  }

  function refresh() {
    const items = $$('.page.active .reveal');

    if (!('IntersectionObserver' in window)) {
      addAll(items);
      return;
    }

    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: CONFIG.revealThreshold,
      rootMargin: CONFIG.revealRootMargin,
    });

    items
      .filter(el => !el.classList.contains('in'))
      .forEach(el => observer.observe(el));
  }

  return { refresh };
})();

/* ---------- 8. CHATBOT ---------- */
const Chatbot = (() => {
  /* ---- Pure logic (testable) ---- */
  const KB = {
    products: "We carry a full frozen line: 🍤 Tempura, 🍟 French Fries, 🥟 Siomai & Siopao, 🐟 Tuna & Boneless Bangus, 🌭 Chorizo & Lumpia, plus 💧 InJoy Powders for Milk Tea, Shakes, Palamig, and Ice Scramble. Which one are you interested in?",
    location: "📍 Main branch: Tamin Building, Barangay 5, Moreno St., Malaybalay City, Bukidnon. Second branch: F. Donggalo Building, Purok 2, Sayre Highway, Valencia City, Bukidnon. Look for the ANF Frozenhaus sign!",
    prices:   "💰 For the latest price list, please visit our store or send us a message on our Facebook page (facebook.com/anffrozenhaus). We'd be happy to send you a quote for bulk orders!",
    hours:    "🕒 Store hours may vary, so please check our Facebook page for the latest schedule. We'd love to see you!",
    delivery: "🚚 For delivery and pickup arrangements, please message us on Facebook so we can confirm availability and logistics for your area.",
    payment:  "💳 Please message us on Facebook to confirm accepted payment methods and terms for bulk orders.",
    reseller: "🤝 Yes! We welcome resellers and food businesses. Message us on Facebook to discuss reseller pricing and minimum order quantities.",
    greeting: "Kumusta! 👋 Welcome to ANF Frozenhaus — Ang Imong Partner sa Negosyo. Ask me about our products, location, prices, or store hours!",
    thanks:   "You're very welcome! 😊 Salamat for choosing ANF Frozenhaus. Anything else I can help you with?",
    fallback: "Salamat for your message! For specific inquiries, please message our Facebook page or visit us in store. Is there anything else I can help you with?",
  };

  // Order matters — first match wins.
  const INTENTS = [
    { key: 'prices',   re: /(price|presyo|pila|magkano|cost|rate)/ },
    { key: 'location', re: /(location|where|asa|saan|address|find|store|branch)/ },
    { key: 'hours',    re: /(hour|open|close|schedule|time|oras)/ },
    { key: 'delivery', re: /(deliver|ship|pickup|pick up)/ },
    { key: 'payment',  re: /(payment|pay|gcash|cash|maya)/ },
    { key: 'reseller', re: /(reseller|wholesale|bulk|business|partner|retail)/ },
    { key: 'products', re: /(product|menu|item|tempura|fries|siomai|siopao|tuna|bangus|chorizo|lumpia|injoy|milk tea|shake)/ },
    { key: 'greeting', re: /(hi|hello|hey|kumusta|good morning|good afternoon|good evening)/ },
    { key: 'thanks',   re: /(thank|salamat|thanks)/ },
  ];

  function pickIntent(text) {
    const t = String(text).toLowerCase();
    const match = INTENTS.find(intent => intent.re.test(t));
    return match ? match.key : 'fallback';
  }

  function getReply(text) {
    return KB[pickIntent(text)] ?? KB.fallback;
  }

  /* ---- DOM-bound UI ---- */
  const els = {
    toggle:       $('#chatToggle'),
    window:       $('#chatWindow'),
    close:        $('#chatClose'),
    body:         $('#chatBody'),
    form:         $('#chatForm'),
    input:        $('#chatInput'),
    send:         $('#chatSend'),
    quickReplies: $('#quickReplies'),
  };

  function setChatOpen(isOpen) {
    if (!els.window) return;
    els.window.classList.toggle('open', isOpen);

    const dot = els.toggle?.querySelector('.dot');
    if (dot && isOpen) dot.style.display = 'none';

    if (isOpen) setTimeout(() => els.input?.focus(), CONFIG.chatFocusDelayMs);
  }

  function hideQuickReplies() {
    if (els.quickReplies) els.quickReplies.style.display = 'none';
  }

  function appendNode(node) {
    if (!els.body) return;
    els.body.appendChild(node);
    els.body.scrollTop = els.body.scrollHeight;
  }

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    if (sender === 'user') div.textContent = text;      // safe by default
    else                   div.innerHTML  = text;       // bot uses trusted KB HTML
    appendNode(div);
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'msg bot typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    appendNode(div);
    return div;
  }

  function botRespond(userText) {
    const typingEl = showTyping();
    const delay = CONFIG.botThinkMinMs + Math.random() * CONFIG.botThinkJitterMs;
    setTimeout(() => {
      typingEl.remove();
      addMessage(getReply(userText), 'bot');
    }, delay);
  }

  function sendUserMessage(text) {
    const clean = text.trim();
    if (!clean) return;
    addMessage(clean, 'user');
    if (els.input) els.input.value = '';
    hideQuickReplies();
    botRespond(clean);
  }

  function init() {
    on(els.toggle, 'click', () => {
      const willOpen = !els.window?.classList.contains('open');
      setChatOpen(willOpen);
    });

    on(els.close, 'click', () => setChatOpen(false));

    on(els.form, 'submit', (e) => {
      e.preventDefault();
      sendUserMessage(els.input?.value ?? '');
    });

    on(els.send, 'click', (e) => {
      e.preventDefault();
      sendUserMessage(els.input?.value ?? '');
    });

    on(els.quickReplies, 'click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const q = btn.getAttribute('data-q');
      addMessage(btn.textContent, 'user');
      hideQuickReplies();
      botRespond(q);
    });
  }

  return { init, getReply, pickIntent, sendUserMessage, hideQuickReplies, open: () => setChatOpen(true) };
})();

/* ---------- 9. ASK-PRICE ---------- */
const AskPrice = (() => {
  const FOCUS_DELAY = 340;

  function init() {
    on(document, 'click', (e) => {
      const btn = e.target.closest('.ask-price');
      if (!btn) return;

      const product = btn.getAttribute('data-product') || 'this product';
      const message = `Hi! Pila ang presyo sa ${product}?`;

      Chatbot.open();
      if (Chatbot.hideQuickReplies) Chatbot.hideQuickReplies();

      const input = $('#chatInput');
      if (input) input.value = message;

      setTimeout(() => {
        if (!input) return;
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }, FOCUS_DELAY);
    });
  }

  return { init };
})();

/* ---------- 10. PUBLIC HTML BRIDGE ---------- */
window.showPage   = (name) => Router.showPage(name);
window.goProducts = ()    => Router.goProducts();
window.openChat   = ()    => Chatbot.open();

/* ---------- 11. BOOT ---------- */
function init() {
  Theme.init();
  Router.init();
  Parallax.init();
  Snow.init();
  Reveal.refresh();
  Chatbot.init();
  AskPrice.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

window.addEventListener('load', () => Reveal.refresh());
