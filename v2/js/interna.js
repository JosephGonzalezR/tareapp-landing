/* Paginas INTERNAS de las webs Tareapp: el movimiento del diseno premium (11-nov-2026, Joseph: "si para todas las
   paginas aplica"). El aspecto vive en /v2/css/tema.css (bloque INTERNAS PREMIUM); aqui solo lo que necesita codigo:
   la barra que se esconde al bajar, el horizonte elastico, la estudiante (cabecera y cierre), lo que entra al bajar,
   las preguntas con el alto animado, el grano y el paso a otra pagina. Sin este archivo la pagina se ve completa.
   No toca textos ni enlaces de WhatsApp (eso es de app.js y su bloque AGS-ORIGEN). */
(function () {
  "use strict";
  var raiz = document.documentElement;
  var clave = raiz.getAttribute("data-int");
  if (!clave) return;
  // Sin la hoja nueva (tema.css de antes: una web a medio publicar o devuelta atras) este archivo no hace nada:
  // la pagina queda como era.
  try { if (!getComputedStyle(raiz).getPropertyValue("--hz-b")) return; } catch (e) { return; }

  var MENOS = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var CABECERAS = ".pricing-hero,.faq-hero,.pay-hero,.proc-hero,.fix-hero,.ref-hero";
  var CIERRES = ".faq-cta,.pay-cta,.proc-note,.fix-cta,.ref-cta";

  /* Lo de la hoja vieja que ya no va con este diseno: las particulas del heroe de Tesis (amarillas sobre amarillo,
     no se veian y gastaban procesador) y la inclinacion 3D de las tarjetas. app.js los arma en DOMContentLoaded,
     que llega despues de este archivo: si no los encuentra, no hace nada. */
  try {
    var part = document.getElementById("hero-particles");
    if (part && part.parentNode) part.parentNode.removeChild(part);
    window.VanillaTilt = undefined;
  } catch (e) { /* nada */ }

  function cabecera() {
    if (clave === "blog") return $("main>.section:first-child .section__head");
    if (clave === "nosotros") return $(".about-hero");
    if (clave === "tesis") return $("main>.hero");
    if (clave === "blog-nota") return $(".article-hero");
    return $(CABECERAS);
  }
  function cierre() { return $(CIERRES) || $("main>.final-cta"); }

  /* ---------- la barra: se esconde al bajar y vuelve al subir; marca la pagina en la que se esta ---------- */
  function barra() {
    var nav = $(".nav");
    if (!nav) return;
    var boton = $("#menuBtn"), menu = $("#mobileMenu");
    var abierto = function () { return !!boton && boton.getAttribute("aria-expanded") === "true"; };
    var y0 = window.scrollY || 0, acum = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY || 0, d = y - y0;
      y0 = y;
      if (abierto()) return;
      if (y < 150) { nav.classList.remove("int-oculta"); acum = 0; return; }
      acum = (d > 0) === (acum > 0) ? acum + d : d;
      if (acum > 70) nav.classList.add("int-oculta");
      else if (acum < -28) nav.classList.remove("int-oculta");
    }, { passive: true });
    nav.addEventListener("focusin", function () { nav.classList.remove("int-oculta"); });
    if (boton && menu) {
      boton.addEventListener("click", function () {
        var r = boton.getBoundingClientRect();
        menu.style.setProperty("--menu-y", Math.round(r.top + r.height / 2) + "px");
        nav.classList.remove("int-oculta");
      }, true);
    }
    var aqui = location.pathname.replace(/index\.html$/, "");
    $$(".nav__links a, .mobile-menu a").forEach(function (a) {
      var h = a.getAttribute("href") || "";
      if (h.charAt(0) !== "/" || h.indexOf("#") !== -1 || a.classList.contains("page-switcher__tab")) return;
      if (h === aqui) a.setAttribute("aria-current", "page");
    });
  }

  /* ---------- el titulo de la cabecera nunca se parte por la mitad de una palabra: si la palabra mas larga no entra
     (un titulo de otro pais, una pantalla angosta), la letra se achica lo justo ---------- */
  function ajustarTitulo() {
    var cab = cabecera(), h = cab && $("h1", cab);
    if (!h) return;
    var medir = function () {
      h.style.removeProperty("font-size");
      var est = getComputedStyle(h), ancho = h.clientWidth;
      if (!ancho) return;
      var s = document.createElement("span");
      s.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0";
      ["fontFamily", "fontSize", "fontWeight", "fontStretch", "letterSpacing", "textTransform"].forEach(function (k) { s.style[k] = est[k]; });
      document.body.appendChild(s);
      var mayor = 0;
      (h.textContent || "").split(/\s+/).forEach(function (p) { if (!p) return; s.textContent = p; mayor = Math.max(mayor, s.getBoundingClientRect().width); });
      document.body.removeChild(s);
      // la hoja fija el tamano con !important: el ajuste tambien lo lleva
      if (mayor > ancho) h.style.setProperty("font-size", (parseFloat(est.fontSize) * ancho / mayor * 0.985).toFixed(1) + "px", "important");
    };
    medir();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    var t = 0;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(medir, 120); });
  }

  /* ---------- destellos tenues al fondo de la cabecera y del cierre (los de la portada). Ninguno queda detras de un
     texto: el que cae sobre una linea se apaga ---------- */
  function destellos() {
    var FORMAS = [
      '<path d="M12 0c1.2 6.8 5.2 10.8 12 12-6.8 1.2-10.8 5.2-12 12-1.2-6.8-5.2-10.8-12-12 6.8-1.2 10.8-5.2 12-12z"/>',
      '<circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="3.4"/>',
      '<path d="M12 3v18M3 12h18" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>',
      '<circle cx="12" cy="12" r="5"/>'
    ];
    var s = 20261111;
    var azar = function () { s = (Math.imul(s, 1103515245) + 12345) | 0; return ((s >>> 8) & 0xffff) / 65535; };
    [cabecera(), cierre()].forEach(function (zona) {
      if (!zona) return;
      var caja = document.createElement("div");
      caja.className = "int-cielo";
      caja.setAttribute("aria-hidden", "true");
      var n = window.innerWidth < 760 ? 7 : 11, html = "";
      for (var i = 0; i < n; i++) {
        var tam = 13 + azar() * 26, x = 3 + azar() * 94, y = 5 + azar() * 74, rot = Math.round(azar() * 70 - 35);
        html += '<svg viewBox="0 0 24 24" width="' + tam.toFixed(0) + '" height="' + tam.toFixed(0) + '" style="left:' + x.toFixed(1) + "%;top:" + y.toFixed(1) +
          "%;transform:rotate(" + rot + 'deg)">' + FORMAS[i % FORMAS.length] + "</svg>";
      }
      caja.innerHTML = html;
      zona.insertBefore(caja, zona.firstChild);
      var despejar = function () {
        var textos = [];
        $$("h1,h2,p,.badge,.btn,.hero__pill,.trust-badges,.mockup,.hero__actions,.int-amiga,.int-saluda", zona).forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.width && r.height) textos.push(r);
        });
        $$("svg", caja).forEach(function (f) {
          var r = f.getBoundingClientRect(), tapa = false;
          for (var k = 0; k < textos.length && !tapa; k++) {
            var t = textos[k];
            tapa = r.right > t.left - 10 && r.left < t.right + 10 && r.bottom > t.top - 8 && r.top < t.bottom + 8;
          }
          f.style.visibility = tapa ? "hidden" : "";
        });
      };
      despejar();
      setTimeout(despejar, 2600);
      var t = 0;
      window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(despejar, 200); });
    });
  }

  /* ---------- grano de impresion sobre toda la pagina (el mismo de la portada) ---------- */
  function grano() {
    try {
      var n = 168, c = document.createElement("canvas");
      c.width = c.height = n;
      var x = c.getContext("2d"), im = x.createImageData(n, n), d = im.data, s = 20261110;
      var azar = function () { s = (Math.imul(s, 1664525) + 1013904223) | 0; return ((s >>> 9) & 0xffff) / 65535; };
      for (var i = 0; i < d.length; i += 4) {
        var v = azar();
        d[i] = d[i + 1] = d[i + 2] = v > 0.5 ? 255 : 0;
        d[i + 3] = Math.round(Math.abs(v - 0.5) * 2 * 30);
      }
      x.putImageData(im, 0, 0);
      var g = document.createElement("div");
      g.className = "int-grano";
      g.setAttribute("aria-hidden", "true");
      g.style.backgroundImage = "url(" + c.toDataURL("image/png") + ")";
      g.style.backgroundSize = Math.round(n / Math.min(2, window.devicePixelRatio || 1)) + "px";
      document.body.appendChild(g);
    } catch (e) { /* sin grano no pasa nada */ }
  }

  /* ---------- lo que entra al bajar: solo lo que al cargar todavia no se ve ---------- */
  function entradas() {
    if (MENOS || !("IntersectionObserver" in window)) return;
    var lista = $$([".work-price", ".quote-cta", ".partial-cta", ".footer-note", ".faq-item", ".step", ".proc-diffs-head", ".diff-card", ".bank-card",
      ".steps-pay", ".ref-anio", ".ref-mes", ".ev-obras .obra", ".nt-cab", ".nt-card", ".op-card", ".payment-option-card", ".note-section", ".social-proof",
      ".fix-wrap>*", ".tabs", ".article-content>*", ".article-sidebar>*", "[data-int=legal] main .card>*"].join(","));
    var alto = window.innerHeight;
    var esperan = lista.filter(function (el) {
      if (el.hasAttribute("data-reveal") || el.closest("[data-reveal]")) return false;
      return el.getBoundingClientRect().top > alto * 0.96;
    });
    if (!esperan.length) return;
    esperan.forEach(function (el) { el.classList.add("int-espera"); });
    var ver = new IntersectionObserver(function (es) {
      var i = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--i", String(Math.min(i++, 6)));
        e.target.classList.add("int-ve");
        ver.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    esperan.forEach(function (el) { ver.observe(el); });
    // red de seguridad: si este navegador no avisa cuando algo entra en pantalla (se prueba con la pagina misma, que
    // siempre esta a la vista), nada puede quedar oculto: se muestra todo
    var avisa = false;
    var testigo = new IntersectionObserver(function (es) { if (es[0] && es[0].isIntersecting) avisa = true; testigo.disconnect(); });
    testigo.observe(document.body);
    setTimeout(function () {
      if (avisa) return;
      esperan.forEach(function (el) { el.classList.add("int-ve"); });
      ver.disconnect();
    }, 1600);
    // un ancla (#comprobante) o un salto largo: lo que quedo arriba de la pantalla tambien se muestra
    var repasar = function () {
      esperan.forEach(function (el) {
        if (!el.classList.contains("int-ve") && el.getBoundingClientRect().top < alto * 0.5) { el.classList.add("int-ve"); ver.unobserve(el); }
      });
    };
    window.addEventListener("hashchange", function () { setTimeout(repasar, 60); });
    setTimeout(repasar, 900);
  }

  /* ---------- preguntas y meses: se abren y se cierran con el alto animado (antes saltaban) ---------- */
  function acordeones() {
    if (MENOS || !Element.prototype.animate) return;
    $$("details.faq-item, details.ref-mes, .faq details, details.qa").forEach(function (d) {
      var s = $("summary", d);
      if (!s) return;
      var anim = null;
      s.addEventListener("click", function (e) {
        if (e.defaultPrevented) return;
        e.preventDefault();
        if (anim) { anim.onfinish = null; anim.cancel(); anim = null; }
        var abrir = !d.open || d.classList.contains("int-cierra");
        var desde = d.offsetHeight;
        d.style.overflow = "hidden";
        var fin = function () { d.style.overflow = ""; d.classList.remove("int-cierra"); anim = null; };
        if (abrir) {
          d.classList.remove("int-cierra");
          d.open = true;
          var hasta = d.offsetHeight;
          anim = d.animate({ height: [desde + "px", hasta + "px"] }, { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" });
          anim.onfinish = fin;
          $$(":scope > :not(summary)", d).forEach(function (c) {
            c.animate({ opacity: [0, 1], transform: ["translateY(-10px)", "none"] }, { duration: 460, delay: 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
          });
        } else {
          d.classList.add("int-cierra");
          var cerrado = s.offsetHeight + (d.offsetHeight - d.clientHeight);
          anim = d.animate({ height: [desde + "px", cerrado + "px"] }, { duration: 300, easing: "cubic-bezier(.4,0,.2,1)" });
          anim.onfinish = function () { d.open = false; fin(); };
        }
      });
    });
  }

  /* ---------- horizontes elasticos: la loma se hincha al bajar rapido y se aplana al subir ---------- */
  var lomas = [], amiga = null;
  function hzb() { return clamp(0.07 * window.innerWidth, 34, 112); }
  function horizontes() {
    var cab = cabecera(), cie = cierre(), pie = $(".footer");
    // Cada loma pasa a ser un elemento propio (la que dibuja el CSS se apaga): asi se estira con transform y el
    // navegador no vuelve a calcular el estilo de todo lo que hay dentro de la seccion en cada cuadro.
    var poner = function (el, abajo) {
      if (!el) return;
      var hz = document.createElement("div");
      hz.className = "int-hz " + (abajo ? "int-hz--abajo" : "int-hz--arriba");
      hz.setAttribute("aria-hidden", "true");
      el.appendChild(hz);
      el.classList.add(abajo ? "int-con-hz-abajo" : "int-con-hz-arriba");
      lomas.push({ el: el, hz: hz, k: 1, top: 0, alto: 0 });
    };
    poner(cab, true); poner(cie, false); poner(pie, false);
    if (MENOS || !lomas.length) return;
    var medir = function () {
      var sy = window.scrollY || 0;
      lomas.forEach(function (h) { var r = h.el.getBoundingClientRect(); h.top = r.top + sy; h.alto = r.height; });
    };
    medir();
    window.addEventListener("resize", medir);
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(document.body);
    var y0 = window.scrollY || 0, t0 = 0, vel = 0, activo = false;
    var tic = function (t) {
      var dt = t0 ? Math.min(0.05, (t - t0) / 1000) : 0.016;
      t0 = t;
      var y = window.scrollY || 0;
      var v = dt > 0 ? (y - y0) / dt : 0;
      y0 = y;
      vel += (v - vel) * Math.min(1, dt * 10);
      var meta = clamp(1 + clamp(vel / 2600, -0.42, 0.6), 0.5, 1.6), quieto = Math.abs(vel) < 4;
      var alto = window.innerHeight;
      lomas.forEach(function (h) {
        var cerca = h.top + h.alto - y > -200 && h.top - y < alto + 200;
        if (!cerca && h.k === 1) return;
        h.k += ((cerca ? meta : 1) - h.k) * Math.min(1, dt * 7);
        if (Math.abs(h.k - 1) > 0.004) quieto = false; else h.k = 1;
        h.hz.style.transform = h.k === 1 ? "" : "scaleY(" + h.k.toFixed(3) + ")";
      });
      if (amiga) amiga.suelo(lomas[0] && lomas[0].el === cab ? lomas[0].k : 1);
      if (quieto) { activo = false; t0 = 0; vel = 0; return; }
      requestAnimationFrame(tic);
    };
    window.addEventListener("scroll", function () {
      if (activo) return;
      activo = true; y0 = window.scrollY || 0; t0 = 0;
      requestAnimationFrame(tic);
    }, { passive: true });
  }

  /* ---------- la estudiante: baja con el paraguas a la cabecera y toma la pose de la pagina; en el cierre, saluda ---------- */
  var POSE = {
    "precios-trabajos": { pose: "lee" },
    "precios": { pose: "celebra" },
    "procedimiento": { pose: "presenta", extra: { mDx: 34, mDy: 46, cab: 8, ojos: "abajo", boca: "sonrisa" } },
    "referencias": { pose: "pulgar" },
    "faq": { pose: "celular" },
    "pago": { pose: "celular", extra: { boca: "abierta", ojos: "feliz" } },
    "pago-problemas": { pose: "celular", extra: { ojos: "preocupado", boca: "ondulada", sudor: 1, cab: 10 } },
    "nosotros": { pose: "saludo", saluda: true },
    "blog": { pose: "lee" }
  };
  function cargarPersonaje(listo) {
    if (window.Personaje) { listo(); return; }
    // el dibujo trae una tarjeta con la nota (no se usa aqui): sin esto llevaria escrita la de Chile en la pagina de otro pais
    if (!window.AGS_V2) window.AGS_V2 = { nota: " " };
    var s = document.createElement("script");
    s.src = "/v2/js/estudiante.js?v=20261012";
    s.async = true;
    s.onload = function () { if (window.Personaje) listo(); };
    document.head.appendChild(s);
  }
  function estudiante() {
    var cab = cabecera(), conf = POSE[clave], cie = cierre();
    if (!((cab && conf) || cie)) return;
    cargarPersonaje(function () {
      var P = window.Personaje, POSES = P.POSES, mezclar = P.mezclar;
      var actores = [];

      if (cab && conf && clave !== "tesis") {
        var caja = document.createElement("div");
        caja.className = "int-amiga";
        caja.setAttribute("aria-hidden", "true");
        var p = new P({ piel: "estudiante" });
        var base = Object.assign({}, POSES[conf.pose], conf.extra || {});
        p.pose = Object.assign({}, base); p.mira = -1; p.render();
        caja.appendChild(p.svg);
        cab.appendChild(caja);
        var k = 1, dy = 0;
        var colocar = function () {
          var w = cab.clientWidth || 1, hC = caja.offsetHeight;
          var dx = (caja.offsetLeft + caja.offsetWidth / 2) / w - 0.5;
          var loma = hzb() * (3.92 * Math.sqrt(Math.max(0, 1 - (dx / 0.75) * (dx / 0.75))) - 2.92);
          caja.style.bottom = Math.round(loma - hC * (25 / 395) - 3) + "px";
          caja._loma = loma;
        };
        colocar();
        window.addEventListener("resize", colocar);
        amiga = { suelo: function (kk) { k = kk; caja.style.transform = "translateY(" + (dy - (k - 1) * (caja._loma || 0)).toFixed(1) + "px)"; } };
        var visible = true;
        if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(caja);
        var t0 = performance.now() / 1000, dur = 1.9, guino = 0, prox = 2.2, llego = MENOS;
        var alto0 = Math.min(cab.offsetHeight * 0.9, window.innerHeight * 0.6);
        if (MENOS) { caja.classList.add("int-lista"); }
        var cuadro = 0;
        actores.push(function (t) {
          if (llego && !visible) return;
          // quieta en su sitio se dibuja a media velocidad (30 por segundo): alcanza para el parpadeo y el vaiven
          if (llego && (cuadro++ & 1)) return;
          var pose;
          if (!llego) {
            var u = (t - t0) / dur;
            if (u >= 1) { llego = true; dy = 0; }
            else {
              var g = clamp(u / 0.8, 0, 1), baja = 1 - Math.pow(1 - g, 3);
              var flota = Object.assign({}, POSES.flota);
              flota.paraguas = clamp((0.94 - u) / 0.1, 0, 1);
              flota.pDx += Math.sin(t * 3.1) * 5; flota.pTx += Math.sin(t * 3.1 + 1.4) * 5;
              flota.pDy += Math.cos(t * 3.1) * 3; flota.mTy += Math.sin(t * 2.3) * 4;
              flota.cola = 60 + (1 - baja) * 18;
              flota.sinSombra = g < 0.86 ? 1 : 0;
              var at = clamp((u - 0.78) / 0.22, 0, 1); at = at * at * (3 - 2 * at);
              pose = at > 0 ? mezclar(flota, base, at) : flota;
              if (at > 0 && at < 1) pose.bob = Math.sin(at * Math.PI) * 5;      // se hunde un instante al tocar el suelo
              dy = -(1 - baja) * alto0;
              caja.style.transform = "translateY(" + (dy - (k - 1) * (caja._loma || 0)).toFixed(1) + "px) rotate(" + (Math.sin(t * 2.2) * 3 * (1 - baja)).toFixed(2) + "deg)";
              caja.classList.add("int-lista");
              p.mira = at > 0.6 ? -1 : 1;
              p.pose = pose; p.render();
              return;
            }
          }
          pose = Object.assign({}, base);
          pose.bob = Math.sin(t * 2.2) * 0.8;
          if (conf.saluda) { pose.mDx += Math.sin(t * 9) * 9; pose.mDy += Math.cos(t * 9) * 4; }
          else if (conf.pose === "presenta") { pose.mDx += Math.sin(t * 1.7) * 3; pose.mDy += Math.cos(t * 1.7) * 2; }
          else if (conf.pose === "lee" || conf.pose === "celular") { pose.cab = (pose.cab || 0) + Math.sin(t * 1.1) * 2.2; }
          else if (conf.pose === "celebra") { pose.mDy += Math.sin(t * 3.2) * 4; pose.mTy += Math.cos(t * 3.2) * 4; }
          if (t > prox) { guino = t + 0.12; prox = t + 2.4 + Math.random() * 3; }
          p.parpadeo = t < guino ? 1 : 0;
          p.mira = -1; p.pose = pose; p.render();
          caja.style.transform = "translateY(" + (-(k - 1) * (caja._loma || 0)).toFixed(1) + "px)";
        });
      }

      if (cie) {
        var caja2 = document.createElement("div");
        caja2.className = "int-saluda";
        caja2.setAttribute("aria-hidden", "true");
        var q = new P({ piel: "estudiante" });
        q.pose = Object.assign({}, POSES.saludo); q.mira = -1; q.render();
        caja2.appendChild(q.svg);
        cie.appendChild(caja2);
        var visible2 = false, guino2 = 0, prox2 = 2;
        if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible2 = es[0].isIntersecting; }).observe(caja2);
        var cuadro2 = 0;
        if (!MENOS) actores.push(function (t) {
          if (!visible2 || (cuadro2++ & 1)) return;
          var pose = Object.assign({}, POSES.saludo);
          pose.mDx += Math.sin(t * 9) * 9; pose.mDy += Math.cos(t * 9) * 4;
          pose.bob = Math.sin(t * 2.2) * 0.8;
          if (t > prox2) { guino2 = t + 0.12; prox2 = t + 2.4 + Math.random() * 3; }
          q.parpadeo = t < guino2 ? 1 : 0;
          q.mira = -1; q.pose = pose; q.render();
        });
      }

      if (MENOS || !actores.length) return;
      var bucle = function (ms) {
        var t = ms / 1000;
        for (var i = 0; i < actores.length; i++) actores[i](t);
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);
    });
  }

  /* ---------- el paso a otra pagina: su color sube como una loma y cubre la pantalla; la pagina que llega se
     descubre sola (CSS). Solo enlaces del sitio a paginas de este diseno; lo demas pasa como siempre.
     Si la pagina no cambia (sin red) o se vuelve con "atras", el telon se retira. ---------- */
  var COLOR = { "/": "#F7C948", "/tesis/": "#F7C948", "/precios-trabajos/": "#C8F03C", "/precios/": "#7A4DFF", "/procedimiento/": "#2B3CFF",
    "/referencias/": "#FF5A4E", "/faq/": "#F7C948", "/pago/": "#2B3CFF", "/pago/problemas/": "#FF5A4E", "/nosotros/": "#7A4DFF", "/blog/": "#C8F03C",
    "/terms/": "#F7C948", "/privacy/": "#F7C948" };
  function paso() {
    if (MENOS) return;
    var telon = document.createElement("div");
    telon.className = "int-telon";
    telon.setAttribute("aria-hidden", "true");
    document.body.appendChild(telon);
    var saliendo = false, t1 = 0, t2 = 0;
    var soltar = function () { saliendo = false; clearTimeout(t1); clearTimeout(t2); telon.classList.remove("int-sale"); };
    document.addEventListener("click", function (e) {
      if (saliendo || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-wa-message")) return;
      var crudo = a.getAttribute("href") || "";
      if (crudo.charAt(0) !== "/" || crudo.charAt(1) === "/") return;
      var u;
      try { u = new URL(a.href); } catch (err) { return; }
      if (u.origin !== location.origin) return;
      var ruta = u.pathname.replace(/index\.html$/, "");
      var color = COLOR[ruta] || (/^\/blog\/[^/]+\/$/.test(ruta) ? "#F7C948" : "");
      if (!color || ruta === location.pathname.replace(/index\.html$/, "")) return;
      e.preventDefault();
      saliendo = true;
      var destino = a.href;
      telon.style.setProperty("--telon-a", color);
      telon.getBoundingClientRect();
      telon.classList.add("int-sale");
      t1 = setTimeout(function () { location.href = destino; }, 350);
      t2 = setTimeout(soltar, 4500);
    });
    window.addEventListener("pageshow", function (ev) { if (ev.persisted) soltar(); });
  }

  barra();
  ajustarTitulo();
  horizontes();
  entradas();
  acordeones();
  paso();
  var despues = function () { grano(); destellos(); estudiante(); };
  if (document.readyState === "complete") setTimeout(despues, 60);
  else window.addEventListener("load", function () { setTimeout(despues, 60); });
})();
