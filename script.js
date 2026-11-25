/* ---------- ANTI-FLASH THEME ---------- */
(function(){
  try{
    if(localStorage.getItem('theme') === 'dark'){
      document.documentElement.setAttribute('data-theme','dark');
    }
  }catch(e){}
})();

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- PAGE ROUTER ---------- */
function showPage(name){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if(target) target.classList.add('active');
  window.scrollTo({ top:0, behavior:'auto' });
  updateNav();
  observeReveals();
}

function goProducts(){
  showPage('home');
  setTimeout(() => {
    const el = document.getElementById('products');
    if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }, 60);
}

/* ---------- NAV + SCROLL PROGRESS ---------- */
const nav = document.getElementById('nav');
const progress = document.getElementById('scrollProgress');

function updateNav(){
  if(window.scrollY > 60) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');

  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
  if(progress) progress.style.width = pct + '%';
}
window.addEventListener('scroll', updateNav, { passive:true });
window.addEventListener('resize', updateNav);
updateNav();

/* ---------- PARALLAX — HERO BG ---------- */
const heroBg = document.getElementById('heroBg');
let bgTicking = false;
window.addEventListener('scroll', () => {
  if(bgTicking || REDUCE) return;
  bgTicking = true;
  requestAnimationFrame(() => {
    if(heroBg){
      const y = window.scrollY;
      if(y < window.innerHeight * 1.3){
        heroBg.style.transform = 'translate3d(0,' + (y * 0.42) + 'px,0) scale(1.05)';
      }
    }
    bgTicking = false;
  });
}, { passive:true });

/* ---------- PARALLAX — FLOATING CARDS ---------- */
(function heroCardParallax(){
  const els = Array.from(document.querySelectorAll('[data-parallax]'));
  if(!els.length || REDUCE) return;

  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', (e) => {
    tx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    ty = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  });

  function loop(){
    mx += (tx - mx) * 0.07;
    my += (ty - my) * 0.07;
    const sc = window.scrollY;

    els.forEach(el => {
      const rate  = parseFloat(el.dataset.parallax) || 0.1;
      const depth = parseFloat(el.dataset.depth) || 1;
      const x = mx * 16 * depth;
      const y = my * 12 * depth - sc * rate * 0.35;
      el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
    });

    requestAnimationFrame(loop);
  }
  loop();
})();

/* ---------- SNOWFLAKES ---------- */
(function buildSnow(){
  const snow = document.getElementById('snow');
  if(!snow || REDUCE) return;
  const icons = ['fa-snowflake','fa-asterisk','fa-star'];
  for(let i = 0; i < 18; i++){
    const el = document.createElement('i');
    el.className = 'fa-solid ' + icons[Math.floor(Math.random() * icons.length)];
    el.style.left = (Math.random() * 100) + '%';
    el.style.fontSize = (8 + Math.random() * 14) + 'px';
    el.style.animationDuration = (9 + Math.random() * 12) + 's';
    el.style.animationDelay = (Math.random() * 12) + 's';
    el.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
    snow.appendChild(el);
  }
})();

/* ---------- SCROLL REVEAL ---------- */
let revealObserver;
function observeReveals(){
  const items = document.querySelectorAll('.page.active .reveal');
  if(!('IntersectionObserver' in window)){
    items.forEach(el => el.classList.add('in'));
    return;
  }
  if(revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.12, rootMargin:'0px 0px -50px 0px' });

  items.forEach(el => {
    if(!el.classList.contains('in')) revealObserver.observe(el);
  });
}

/* ---------- CHATBOT ---------- */
const chatToggle   = document.getElementById('chatToggle');
const chatWindow   = document.getElementById('chatWindow');
const chatClose    = document.getElementById('chatClose');
const chatBody     = document.getElementById('chatBody');
const chatForm     = document.getElementById('chatForm');
const chatInput    = document.getElementById('chatInput');
const quickReplies = document.getElementById('quickReplies');

function openChat(){
  if(!chatWindow) return;
  chatWindow.classList.add('open');
  const dot = chatToggle && chatToggle.querySelector('.dot');
  if(dot) dot.style.display = 'none';
  setTimeout(() => chatInput && chatInput.focus(), 320);
}

if(chatToggle && chatWindow && chatClose){
  chatToggle.addEventListener('click', () => {
    const isOpen = chatWindow.classList.toggle('open');
    if(isOpen){
      const dot = chatToggle.querySelector('.dot');
      if(dot) dot.style.display = 'none';
      setTimeout(() => chatInput.focus(), 300);
    }
  });
  chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));
}

/* ---- Knowledge base ---- */
const KB = {
  products: "We carry a full frozen line: 🍤 Tempura, 🍟 French Fries, 🥟 Siomai & Siopao, 🐟 Tuna & Boneless Bangus, 🌭 Chorizo & Lumpia, plus 💧 InJoy Powders for Milk Tea, Shakes, Palamig, and Ice Scramble. Which one are you interested in?",
  location: "📍 Main branch: Tamin Building, Barangay 5, Moreno St., Malaybalay City, Bukidnon. Second branch: F. Donggalo Building, Purok 2, Sayre Highway, Valencia City, Bukidnon. Look for the ANF Frozenhaus sign!",
  prices: "💰 For the latest price list, please visit our store or send us a message on our Facebook page (facebook.com/anffrozenhaus). We'd be happy to send you a quote for bulk orders!",
  hours: "🕒 Store hours may vary, so please check our Facebook page for the latest schedule. We'd love to see you!",
  delivery: "🚚 For delivery and pickup arrangements, please message us on Facebook so we can confirm availability and logistics for your area.",
  payment: "💳 Please message us on Facebook to confirm accepted payment methods and terms for bulk orders.",
  reseller: "🤝 Yes! We welcome resellers and food businesses. Message us on Facebook to discuss reseller pricing and minimum order quantities.",
  greeting: "Kumusta! 👋 Welcome to ANF Frozenhaus — Ang Imong Partner sa Negosyo. Ask me about our products, location, prices, or store hours!",
  thanks: "You're very welcome! 😊 Salamat for choosing ANF Frozenhaus. Anything else I can help you with?",
  fallback: "Salamat for your message! For specific inquiries, please message our Facebook page or visit us in store. Is there anything else I can help you with?"
};

function getReply(text){
  const t = text.toLowerCase();
  if(/(price|presyo|pila|magkano|cost|rate)/.test(t)) return KB.prices;
  if(/(location|where|asa|saan|address|find|store|branch)/.test(t)) return KB.location;
  if(/(hour|open|close|schedule|time|oras)/.test(t)) return KB.hours;
  if(/(deliver|ship|pickup|pick up)/.test(t)) return KB.delivery;
  if(/(payment|pay|gcash|cash|maya)/.test(t)) return KB.payment;
  if(/(reseller|wholesale|bulk|business|partner|retail)/.test(t)) return KB.reseller;
  if(/(product|menu|item|tempura|fries|siomai|siopao|tuna|bangus|chorizo|lumpia|injoy|milk tea|shake)/.test(t)) return KB.products;
  if(/(hi|hello|hey|kumusta|good morning|good afternoon|good evening)/.test(t)) return KB.greeting;
  if(/(thank|salamat|thanks)/.test(t)) return KB.thanks;
  return KB.fallback;
}

function addMessage(text, sender){
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.innerHTML = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return div;
}

function showTyping(){
  const div = document.createElement('div');
  div.className = 'msg bot typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return div;
}

function botRespond(userText){
  const typingEl = showTyping();
  setTimeout(() => {
    typingEl.remove();
    addMessage(getReply(userText), 'bot');
  }, 900 + Math.random() * 700);
}

function sendUserMessage(text){
  const clean = text.trim();
  if(!clean) return;
  addMessage(clean.replace(/</g,'&lt;').replace(/>/g,'&gt;'), 'user');
  chatInput.value = '';
  if(quickReplies) quickReplies.style.display = 'none';
  botRespond(clean);
}

if(chatForm){
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendUserMessage(chatInput.value);
  });
}

const chatSendBtn = document.getElementById('chatSend');
if(chatSendBtn){
  chatSendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sendUserMessage(chatInput.value);
  });
}

if(quickReplies){
  quickReplies.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const q = btn.getAttribute('data-q');
    const label = btn.textContent;
    addMessage(label, 'user');
    quickReplies.style.display = 'none';
    botRespond(q);
  });
}

/* ---------- THEME TOGGLE ---------- */
(function initThemeToggle(){
  const root   = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if(!toggle) return;
  const icon = toggle.querySelector('i');

  function initialTheme(){
    try{
      const saved = localStorage.getItem('theme');
      if(saved === 'dark' || saved === 'light') return saved;
    }catch(e){}
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function applyTheme(theme){
    if(theme === 'dark'){
      root.setAttribute('data-theme','dark');
      icon.className = 'fa-solid fa-sun';
      toggle.setAttribute('aria-label','Switch to light mode');
    } else {
      root.removeAttribute('data-theme');
      icon.className = 'fa-solid fa-moon';
      toggle.setAttribute('aria-label','Switch to dark mode');
    }
  }

  applyTheme(initialTheme());

  toggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    try{ localStorage.setItem('theme', next); }catch(e){}
  });
})();

/* ---------- "ASK FOR PRICE" → OPEN CHAT + PRE-FILL ---------- */
(function initAskPrice(){
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ask-price');
    if(!btn) return;

    const product = btn.getAttribute('data-product') || 'this product';
    const message = 'Hi! Pila ang presyo sa ' + product + '?';

    openChat();
    if(quickReplies) quickReplies.style.display = 'none';
    chatInput.value = message;

    setTimeout(() => {
      chatInput.focus();
      const len = chatInput.value.length;
      chatInput.setSelectionRange(len, len);
    }, 340);
  });
})();

/* ---------- INIT ---------- */
window.addEventListener('load', observeReveals);
observeReveals();
