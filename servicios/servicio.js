/* JS de las páginas de servicio (/servicios/). Misma bandada, scroll suave y formulario que index.html. */
(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  /* Oferta de fundador: se oculta sola después del 13/12/2026 */
  if (new Date() > new Date('2026-12-13T23:59:59+01:00')){
    document.querySelectorAll('[data-fundador]').forEach(function(el){ el.hidden = true; });
  }

  var menuBtn = document.getElementById('menuBtn'), mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav){
    var closeMenu = function(){ mobileNav.hidden = true; menuBtn.textContent = 'Menú'; menuBtn.setAttribute('aria-expanded','false'); };
    menuBtn.addEventListener('click', function(){
      var open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Cerrar' : 'Menú';
    });
    mobileNav.addEventListener('click', function(e){ if (e.target.tagName === 'A') closeMenu(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !mobileNav.hidden){ closeMenu(); menuBtn.focus(); } });
  }

  var form = document.getElementById('contactForm'), status = document.getElementById('formStatus'), sendBtn = document.getElementById('sendBtn'), ok = document.getElementById('formOk');
  if (form && window.fetch){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (form.botcheck && form.botcheck.checked) return;
      sendBtn.disabled = true; sendBtn.classList.add('sending'); status.textContent = 'Enviando…';
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function(r){ return r.json().then(function(d){ if (!r.ok || !d.success) throw new Error(d.message || ('HTTP ' + r.status)); }); })
        .then(function(){
          form.reset(); status.textContent = '';
          form.hidden = true; ok.hidden = false; ok.classList.remove('in'); void ok.offsetWidth; ok.classList.add('in');
          ok.focus({ preventScroll: true });
        })
        .catch(function(err){
          status.innerHTML = 'No se ha podido enviar (' + String(err && err.message || 'error').replace(/[<>&]/g, '') + '). Escríbenos a <a href="mailto:hola@mirlastudio.es">hola@mirlastudio.es</a>.';
        })
        .then(function(){ sendBtn.disabled = false; sendBtn.classList.remove('sending'); });
    });
    document.getElementById('againBtn').addEventListener('click', function(){ ok.hidden = true; form.hidden = false; document.getElementById('f-nombre').focus(); });
  }

  /* La bandada: mirlos que vuelan en grupo y siguen al ratón */
  var hero = document.querySelector('.hero'), canvas = document.getElementById('bandada');
  if (hero && canvas && canvas.getContext){
    var ctx = canvas.getContext('2d'), W = 0, H = 0, boids = [], visible = true, colors = {};
    var mouse = { x: 0, y: 0, on: false };
    var readColors = function(){ var cs = getComputedStyle(document.documentElement); colors = { ink: cs.getPropertyValue('--ink').trim(), pico: cs.getPropertyValue('--pico').trim() }; };
    var seed = function(){
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.max(24, Math.min(80, W * H / 11000)));
      boids = [];
      for (var i = 0; i < n; i++) boids.push({ x: W * (.55 + Math.random() * .4), y: H * (.15 + Math.random() * .6), vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1, f: Math.random() * 6, amber: Math.random() < .08, sz: 6 + Math.random() * 5 });
      readColors();
    };
    var bird = function(x, y, ang, w, flap, color){
      var f = Math.sin(flap) * .55;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, w * .55, w * .2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = Math.max(1.2, w * .14); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-w * .1, 0); ctx.quadraticCurveTo(-w * .35, -w * (.5 + f), -w * .8, -w * (.35 + f * 1.4)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w * .1, 0); ctx.quadraticCurveTo(-w * .35, w * (.5 + f), -w * .8, w * (.35 + f * 1.4)); ctx.stroke();
      ctx.restore();
    };
    var step = function(t){
      ctx.clearRect(0, 0, W, H);
      var s = (t || 0) / 1000;
      var gx = mouse.on ? mouse.x : W * (.74 + .16 * Math.sin(s * .35)),
          gy = mouse.on ? mouse.y : H * (.42 + .22 * Math.sin(s * .7));
      for (var i = 0; i < boids.length; i++){
        var b = boids[i], ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, k = 0;
        for (var j = 0; j < boids.length; j++){
          if (i === j) continue;
          var o = boids[j], dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 3600){ k++; ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d2 < 400){ sx -= dx / (d2 + 1) * 18; sy -= dy / (d2 + 1) * 18; } }
        }
        if (k){ b.vx += (ax / k - b.vx) * .05 + (cx / k - b.x) * .0012; b.vy += (ay / k - b.vy) * .05 + (cy / k - b.y) * .0012; }
        b.vx += sx * .06 + (gx - b.x) * .00045; b.vy += sy * .06 + (gy - b.y) * .00045;
        var sp = Math.hypot(b.vx, b.vy);
        if (sp > 3.1){ b.vx *= 3.1 / sp; b.vy *= 3.1 / sp; } else if (sp < 1.3){ b.vx *= 1.3 / sp; b.vy *= 1.3 / sp; }
        b.x += b.vx; b.y += b.vy; b.f += .28 + sp * .05;
        bird(b.x, b.y, Math.atan2(b.vy, b.vx), b.sz, b.f, b.amber ? colors.pico : colors.ink);
      }
    };
    var frame = 0;
    var loop = function(t){ if (visible){ step(t); if (++frame % 120 === 0) readColors(); } requestAnimationFrame(loop); };
    hero.addEventListener('pointermove', function(e){ var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; });
    hero.addEventListener('pointerleave', function(){ mouse.on = false; });
    try { new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }).observe(hero); } catch (e) {}
    window.addEventListener('resize', function(){ clearTimeout(window.__rz); window.__rz = setTimeout(seed, 150); });
    seed();
    if (reduced) step(0); else requestAnimationFrame(loop);
  }

  if (!window.gsap || !window.ScrollTrigger || reduced) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Scroll suave con Lenis */
  var lenis = null;
  try {
    if (window.Lenis){
      lenis = new Lenis({ lerp: .1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  } catch (e) { lenis = null; }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      var el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
      else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.site-header', { y: -22, opacity: 0, duration: .8 })
    .from('.hero-title .line > span', { yPercent: 115, rotate: 3, duration: 1.3, stagger: .1 }, '-=.5')
    .from('.lead, .cta-row > *', { y: 22, opacity: 0, duration: .9, stagger: .06 }, '-=.95')
    .from('.hero-facts > div', { y: 26, opacity: 0, duration: .9, stagger: .07 }, '-=.8')
    .from('#bandada', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0);

  if (document.querySelector('.band-skew')){
    var skewTo = gsap.quickTo('.band-skew', 'skewX', { duration: .5, ease: 'power3' });
    ScrollTrigger.create({ onUpdate: function(self){ skewTo(gsap.utils.clamp(-10, 10, self.getVelocity() / -260)); } });
    ScrollTrigger.addEventListener('scrollEnd', function(){ skewTo(0); });
  }

  gsap.utils.toArray('.pack-name').forEach(function(el, i){
    gsap.fromTo(el, { xPercent: i % 2 ? 4 : -4 }, { xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'center 58%', scrub: 1 } });
  });
  if (document.querySelector('.svc-steps')) gsap.from('.step', { y: 28, opacity: 0, duration: .9, stagger: .09, ease: 'expo.out', scrollTrigger: { trigger: '.svc-steps', start: 'top 85%' } });

  if (document.querySelector('.contact')){
    gsap.fromTo('.contact', { scale: .94, borderRadius: '60px' }, { scale: 1, borderRadius: '32px', ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 48%', scrub: true } });
    gsap.to('.contact-orb', { rotate: 36, yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  if (finePointer){
    document.querySelectorAll('[data-magnetic]').forEach(function(el){
      var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .28);
        yTo((e.clientY - r.top - r.height / 2) * .38);
      });
      el.addEventListener('pointerleave', function(){ gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.4)' }); });
    });
    var cur = document.getElementById('cursor');
    if (cur){
      var cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
      window.addEventListener('pointermove', function(e){ cur.classList.add('on'); cx(e.clientX); cy(e.clientY); });
      document.addEventListener('pointerleave', function(){ cur.classList.remove('on'); });
      document.addEventListener('pointerover', function(e){ cur.classList.toggle('grow', !!e.target.closest('a, button, .pack')); });
    }
  }
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
})();
