/* AGS-ORIGEN inicio (13-oct-2026). El saludo de cada enlace de WhatsApp de la web dice de donde llega la persona:
   "Hola, vengo de TikTok." / Instagram / Facebook / Google, o "Hola, vengo de la página web." Bloque generado: no editar a mano. */
window.AGS_ORIGEN = window.AGS_ORIGEN || (function () {
  var CLAVE = "ags_origen";
  var POR_URL = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", google: "Google" };
  function deLaVisita() {
    var o = "";
    try { o = window.sessionStorage.getItem(CLAVE) || ""; } catch (e) {}
    if (o) return o;
    var ua = navigator.userAgent || "", ref = "", interno = false;
    var par = (((location.search || "").match(/[?&]o=([a-z]+)/i) || [])[1] || "").toLowerCase();
    try { ref = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ""; } catch (e) {}
    if (ref === location.hostname) ref = "";
    function de(dom) { return ref === dom || ref.slice(-(dom.length + 1)) === "." + dom; }
    if (POR_URL[par]) o = POR_URL[par];
    else if (/musical_ly|trill_|Bytedance|TikTok/i.test(ua)) { o = "TikTok"; interno = true; }
    else if (/Instagram/i.test(ua)) { o = "Instagram"; interno = true; }
    else if (/FBAN|FBAV|FB_IAB/i.test(ua)) { o = "Facebook"; interno = true; }
    else if (de("tiktok.com")) o = "TikTok";
    else if (de("instagram.com")) o = "Instagram";
    else if (de("facebook.com") || de("fb.com") || de("fb.me")) o = "Facebook";
    else if (/(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(ref)) o = "Google";
    else o = "la página web";
    try { window.sessionStorage.setItem(CLAVE, o); } catch (e) {}
    // Dentro del navegador de una red, la red queda en la direccion (?o=): si la persona elige "Abrir en el navegador", no se pierde.
    if (interno) {
      try {
        window.history.replaceState(window.history.state, "", location.pathname + (location.search ? location.search + "&" : "?") +
          "o=" + o.toLowerCase() + (location.hash || ""));
      } catch (e) {}
    }
    return o;
  }
  // Solo se toca un mensaje vacio o que empieza con un saludo. Quien escribe por un pago ya es cliente: su mensaje queda igual.
  var SALUDO = /^\s*(¡\s*)?(hola|buen(os)?\s+d[ií]as?|buenas(\s+(tardes|noches))?)(?![a-záéíóúñ])\s*[!,.:;]*\s*/i;
  function saludo(mensaje) {
    var m = String(mensaje == null ? "" : mensaje);
    if (/vengo de /i.test(m)) return m;
    if (/pago|pagar|transferi|comprobante/i.test(m)) return m;
    if (m.replace(/\s/g, "") && !SALUDO.test(m)) return m;
    var resto = m.replace(SALUDO, "");
    var ini = "Hola, vengo de " + deLaVisita() + ".";
    if (!resto.replace(/\s/g, "")) return ini + " Quiero hacer una consulta.";
    return ini + " " + resto.charAt(0).toUpperCase() + resto.slice(1);
  }
  // Enlaces de WhatsApp escritos a mano en la pagina (no pasan por el armador de enlaces)
  function repasar() {
    var as = document.querySelectorAll('a[href*="wa.me/"], a[href*="api.whatsapp.com/send"]');
    for (var i = 0; i < as.length; i++) {
      try {
        var u = new URL(as[i].href);
        var t = u.searchParams.get("text") || "";
        var n = saludo(t);
        if (n === t) continue;
        u.searchParams.delete("text");
        var q = u.searchParams.toString();
        as[i].href = u.origin + u.pathname + "?" + (q ? q + "&" : "") + "text=" + encodeURIComponent(n);
      } catch (e) {}
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", repasar);
  else repasar();
  return { deLaVisita: deLaVisita, saludo: saludo, repasar: repasar };
})();
/* AGS-ORIGEN fin */
(function () {
  "use strict";

  // El pais lo pone su portada en window.AGS_V2 (12-oct-2026, la web nueva en todos los Tareapp); sin eso, Chile.
  const PAIS_V2 = window.AGS_V2 || {};
  const CONFIG = {
    whatsappNumero: PAIS_V2.wa || "56971478131",
    whatsappVisible: PAIS_V2.waVisible || "+56 9 7147 8131",
    nota: PAIS_V2.nota || "7,0",
  };

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const suave = (t) => t * t * (3 - 2 * t);
  const sinIO = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tactil = window.matchMedia("(hover: none)").matches;
  const raiz = document.documentElement;

  /* Velocidad del scroll en px/s, suavizada. Sirve igual con Lenis (escritorio) y con el scroll del celular. */
  const Vel = (function () {
    let ultY = 0, ultT = 0, v = 0;
    return {
      tic(sy, ahora) {
        if (ultT) {
          const dt = Math.max(1, ahora - ultT) / 1000;
          v += ((sy - ultY) / dt - v) * Math.min(1, dt * 9);
          if (Math.abs(v) < 0.5) v = 0;
        }
        ultY = sy; ultT = ahora;
        return v;
      },
    };
  })();

  /* ---------- WhatsApp ---------- */
  function enlacesWA() {
    $$("[data-wa]").forEach((a) => {
      const msg = a.getAttribute("data-wa");
      const msgO = window.AGS_ORIGEN ? window.AGS_ORIGEN.saludo(msg || "") : msg;
      a.href = "https://wa.me/" + CONFIG.whatsappNumero + (msgO ? "?text=" + encodeURIComponent(msgO) : "");
      a.target = "_blank";
      a.rel = "noopener";
    });
    $$("[data-numero]").forEach((n) => { n.textContent = CONFIG.whatsappVisible; });
  }

  /* ---------- escala del personaje ---------- */
  let S = 1, ESC_HEROE = 1.3, MOVIL = false;
  function calcularEscala() {
    const vw = window.innerWidth;
    MOVIL = vw <= 860;
    S = vw > 860 ? clamp(vw / 1400, 0.72, 1.05) : clamp((vw - 40) / 520, 0.56, 0.8);
    ESC_HEROE = vw > 860 ? 1.32 : 1.08;
    document.documentElement.style.setProperty("--s", S.toFixed(4));
  }

  /* ---------- menu y barra ---------- */
  function menu() {
    const b = $("[data-menu]"), m = $("#menu-movil");
    if (!b || !m) return;
    // El panel se abre como un circulo que sale del boton y se cierra volviendo a el (antes aparecia de golpe).
    const animar = !reducido && !!window.gsap;
    const centro = () => { const r = b.getBoundingClientRect(); return Math.round(r.left + r.width / 2) + "px " + Math.round(r.top + r.height / 2) + "px"; };
    let cerrando = null;
    const cerrar = () => {
      b.setAttribute("aria-expanded", "false"); document.body.style.overflow = "";
      if (m.hidden || cerrando) return;
      if (!animar) { m.hidden = true; return; }
      const c = centro();
      gsap.killTweensOf(m);
      cerrando = gsap.fromTo(m, { clipPath: "circle(150% at " + c + ")" }, {
        clipPath: "circle(0% at " + c + ")", duration: 0.32, ease: "power3.out",
        onComplete: () => { m.hidden = true; gsap.set(m, { clearProps: "clipPath" }); cerrando = null; },
      });
    };
    b.addEventListener("click", () => {
      const abierto = b.getAttribute("aria-expanded") === "true";
      if (abierto) { cerrar(); return; }
      if (cerrando) { cerrando.kill(); cerrando = null; }
      b.setAttribute("aria-expanded", "true"); m.hidden = false; document.body.style.overflow = "hidden";
      if (!animar) return;
      const c = centro();
      gsap.fromTo(m, { clipPath: "circle(0% at " + c + ")" }, { clipPath: "circle(150% at " + c + ")", duration: 0.62, ease: "expo.out", onComplete: () => gsap.set(m, { clearProps: "clipPath" }) });
      gsap.fromTo(m.querySelectorAll("nav a"), { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.035, duration: 0.55, ease: "expo.out", delay: 0.1, overwrite: true });
      const cta = m.querySelector(".boton");
      if (cta) gsap.fromTo(cta, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.3, overwrite: true, clearProps: "transform,opacity" });
    });
    m.addEventListener("click", (e) => { if (e.target.closest("a")) cerrar(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && b.getAttribute("aria-expanded") === "true") { cerrar(); b.focus(); } });
  }

  /* ---------- confeti ---------- */
  const Confeti = (function () {
    const cv = $("[data-confeti]");
    if (!cv) return { disparar() {} };
    const ctx = cv.getContext("2d");
    let piezas = [], activo = false, dpr = 1;
    const colores = ["#F7C948", "#FF5A4E", "#2B3CFF", "#C8F03C", "#FFF3D6", "#7A4DFF"];
    function ajustar() { dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
    function paso() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      piezas = piezas.filter((p) => p.vida > 0 && p.y < innerHeight + 40);
      for (const p of piezas) {
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.32; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vida -= 1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7));
        ctx.globalAlpha = Math.min(1, p.vida / 40); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (piezas.length) requestAnimationFrame(paso); else { activo = false; ctx.clearRect(0, 0, cv.width, cv.height); }
    }
    window.addEventListener("resize", ajustar); ajustar();
    return {
      disparar(x, y, n, fuerza) {
        if (reducido) return;
        const f = fuerza || 1;
        for (let i = 0; i < (n || 140); i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = (7 + Math.random() * 11) * f;
          piezas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 7, h: 9 + Math.random() * 9, c: colores[(Math.random() * colores.length) | 0], vida: 120 + Math.random() * 80 });
        }
        if (!activo) { activo = true; requestAnimationFrame(paso); }
      },
    };
  })();

  /* ---------- anillo 3D del heroe ---------- */
  function anillo() {
    const cont = $("[data-anillo]");
    if (!cont) return null;
    const giros = $$("[data-anillo-giro]", cont);
    const medidor = document.createElement("canvas").getContext("2d");
    function armar() {
      giros.forEach((g) => {
        g.innerHTML = "";
        const texto = g.getAttribute("data-anillo-giro");
        const serif = g.classList.contains("anillo__giro--b");
        // el anillo entra completo en la pantalla: su radio no pasa del espacio libre a cada lado del estudiante
        const esc = cont.parentElement.getBoundingClientRect(), cxv = esc.left + esc.width / 2;
        const tope = (Math.min(cxv, document.documentElement.clientWidth - cxv) - 20) / 1.16;
        const radio = Math.min((serif ? 245 : 205) * S * ESC_HEROE, serif ? tope : tope * 0.84);
        medidor.font = serif ? `italic 400 100px "Instrument Serif"` : `900 100px Archivo`;
        if ("fontStretch" in medidor) medidor.fontStretch = serif ? "normal" : "expanded";
        const base = Array.from(texto).map((ch) => medidor.measureText(ch).width || 30);
        const total100 = base.reduce((a, b) => a + b, 0) * 1.06;
        const circ = 2 * Math.PI * radio;
        const fz = (100 * circ) / total100;
        const anchos = base.map((w) => (w * fz) / 100 * 1.06);
        const k = 1;
        let acum = 0;
        Array.from(texto).forEach((ch, i) => {
          const w = anchos[i] * k;
          const ang = ((acum + w / 2) / circ) * 360;
          acum += w;
          for (const atras of [false, true]) {
            const sp = document.createElement("span");
            sp.textContent = ch;
            sp.style.setProperty("--fz", fz + "px");
            if (atras) sp.className = "atras";
            sp.style.transform = `rotateY(${ang.toFixed(2)}deg) translateZ(${radio.toFixed(1)}px)` + (atras ? " rotateY(180deg)" : "") + " translate(-50%,-50%)";
            g.appendChild(sp);
          }
        });
      });
    }
    let giro = 0, vel = 0, enVista = true;
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { enVista = es[0].isIntersecting; }).observe(cont.parentElement);
    // El anillo se inclina con el puntero (escritorio), aparece cuando la estudiante aterriza y se abre y se
    // desvanece cuando ella sale de el al bajar (antes quedaba girando alrededor de nada).
    let ix = 0, iz = 0, mx = 0, mz = 0, suelta = 0;
    const ent = { v: 0 };
    const heroe = cont.closest(".heroe");
    const piso = heroe && heroe.querySelector(".escena--heroe"); // su sombra en el suelo se va con ella
    cont.style.opacity = "0";
    if (heroe && !tactil) {
      heroe.addEventListener("pointermove", (e) => {
        const r = heroe.getBoundingClientRect();
        mx = ((e.clientY - r.top) / r.height - 0.5) * -9; mz = ((e.clientX - r.left) / r.width - 0.5) * 6;
      });
      heroe.addEventListener("pointerleave", () => { mx = mz = 0; });
    }
    return {
      armar,
      tic(dt, impulso, sy) {
        if (!enVista) return;
        vel = lerp(vel, impulso, 0.08);
        giro = (giro + dt * (18 + vel)) % 360;
        giros.forEach((g) => g.style.setProperty("--giro", giro.toFixed(2) + "deg"));
        ix += (mx - ix) * Math.min(1, dt * 5); iz += (mz - iz) * Math.min(1, dt * 5);
        suelta += (clamp((sy || 0) / (innerHeight * 0.3), 0, 1) - suelta) * Math.min(1, dt * 12);
        const s = suave(suelta);
        cont.style.setProperty("--ix", ix.toFixed(2) + "deg");
        cont.style.setProperty("--iz", iz.toFixed(2) + "deg");
        cont.style.opacity = (ent.v * (1 - s)).toFixed(3);
        cont.style.visibility = s > 0.985 ? "hidden" : "";
        cont.style.transform = "scale(" + (lerp(0.7, 1, ent.v) * (1 + 0.14 * s)).toFixed(4) + ")";
        if (piso) piso.style.opacity = (1 - s).toFixed(3);
      },
      entrar(espera) { gsap.to(ent, { v: 1, duration: 1.2, ease: "expo.out", delay: espera || 0 }); },
      centrar(x, y) { cont.style.left = x + "px"; cont.style.top = y + "px"; },
      el: cont,
    };
  }

  /* ---------- aire: rachas de viento mientras baja con el paraguas y polvo cuando aterriza ---------- */
  const Aire = (function () {
    let cv = null, ctx = null, dpr = 1, W = 0, H = 0, ps = [], activo = false, ult = 0;
    const TINTA = "22,18,14", CREMA = "255,243,214";
    function ajustar() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    function asegurar() {
      if (cv) return true;
      if (reducido) return false;
      cv = document.createElement("canvas");
      cv.className = "aire"; cv.setAttribute("aria-hidden", "true");
      document.body.appendChild(cv);
      ctx = cv.getContext("2d");
      ajustar();
      window.addEventListener("resize", ajustar);
      return true;
    }
    function paso(ahora) {
      const dt = Math.min(0.05, (ahora - ult) / 1000); ult = ahora;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ps = ps.filter((p) => p.t < p.dur);
      ctx.lineCap = "round";
      for (const p of ps) {
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const u = p.t / p.dur, a = p.a * Math.min(1, u / 0.18) * (1 - u) * (1 - u);
        if (a <= 0.004) continue;
        if (p.racha) {
          ctx.strokeStyle = "rgba(" + p.c + "," + a.toFixed(3) + ")"; ctx.lineWidth = p.g;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.l); ctx.stroke();
        } else {
          p.vx *= 0.94; p.vy *= 0.94;
          ctx.fillStyle = "rgba(" + p.c + "," + a.toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.g * (0.6 + 1.5 * u), 0, 6.2832); ctx.fill();
        }
      }
      if (ps.length) requestAnimationFrame(paso); else { activo = false; ctx.clearRect(0, 0, W, H); }
    }
    function arrancar() { if (!activo) { activo = true; ult = performance.now(); requestAnimationFrame(paso); } }
    return {
      // x, y = pies de la estudiante en la pantalla; vel = velocidad del scroll; clara = va sobre un fondo oscuro o saturado
      racha(x, y, vel, clara, s) {
        if (!asegurar() || ps.length > 46) return;
        const m = Math.abs(vel), dir = vel > 0 ? -1 : 1;
        ps.push({ racha: 1, x: x + (Math.random() - 0.5) * 340 * s, y: y - (30 + Math.random() * 340) * s, vx: 0, vy: dir * (150 + m * 0.4),
          l: clamp(m * 0.034, 14, 64) * (0.6 + Math.random() * 0.7), g: 2 + Math.random() * 1.8, c: clara ? CREMA : TINTA,
          a: clara ? 0.66 : 0.36, t: 0, dur: 0.4 + Math.random() * 0.36 });
        arrancar();
      },
      polvo(x, y, clara, s) {
        if (!asegurar()) return;
        for (let i = 0; i < 9; i++) {
          const lado = i % 2 ? 1 : -1;
          ps.push({ x: x + lado * (8 + Math.random() * 26) * s, y: y - Math.random() * 4, vx: lado * (60 + Math.random() * 150) * s, vy: -(8 + Math.random() * 46) * s,
            g: (3 + Math.random() * 4.5) * s, c: clara ? CREMA : TINTA, a: clara ? 0.6 : 0.3, t: 0, dur: 0.42 + Math.random() * 0.3 });
        }
        arrancar();
      },
    };
  })();

  /* ---------- particulas 7,0 ---------- */
  function particulas() {
    const cv = $("[data-particulas]");
    if (!cv) return null;
    const sec = cv.parentElement;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, pts = [], N = 0, morf = 0, visible = false, raton = { x: -9999, y: -9999 };
    function objetivos(cx, cy, alto) {
      const off = document.createElement("canvas");
      // el ancho sale del texto de la nota del pais ("7,0", "10", "5,0", "20", "100"): con el de Chile fijo el 100 se cortaba
      const letra = (c) => {
        c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
        c.font = `900 ${alto}px Archivo, "Arial Black", sans-serif`;
        if ("fontStretch" in c) c.fontStretch = "expanded";
      };
      letra(off.getContext("2d"));
      const ow = Math.round(Math.max(alto * 1.9, off.getContext("2d").measureText(CONFIG.nota).width * 1.12));
      const oh = Math.round(alto * 1.15);
      off.width = ow; off.height = oh;
      const o = off.getContext("2d");
      letra(o);
      o.fillText(CONFIG.nota, ow / 2, oh / 2 + alto * 0.04);
      const d = o.getImageData(0, 0, ow, oh).data;
      const paso = Math.max(3, Math.round(alto / 70));
      const lista = [];
      for (let y = 0; y < oh; y += paso) for (let x = 0; x < ow; x += paso) if (d[(y * ow + x) * 4 + 3] > 140) lista.push([cx - ow / 2 + x, cy - oh / 2 + y]);
      return lista;
    }
    function armar() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      W = sec.clientWidth; H = sec.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const movil = MOVIL;
      N = movil ? 900 : 1700;
      const caja = $(".estacion__escena", sec), escena = caja.getBoundingClientRect(), sr = sec.getBoundingClientRect();
      // celular: el 7,0 va centrado en el espacio libre entre el borde de arriba de la escena y los personajes (Joseph 4-oct:
      // "el 7 mas centrado"); el estudiante baja recien bajo el 7,0
      const alto = movil ? Math.min(escena.width * 0.44, escena.height * 0.27, 210) : Math.min(escena.width * 0.62, H * 0.42, 420);
      const cx = movil ? escena.left - sr.left + escena.width / 2 : escena.left - sr.left + escena.width * 0.52;
      let cy = H * 0.42;
      if (movil) {
        const svg = $("[data-escena]", caja), vr = svg ? svg.getBoundingClientRect() : escena;
        const k = svg ? Math.min(vr.width / 470, vr.height / 330) : 0;
        const libreTop = escena.top - sr.top, libreBot = (svg ? vr.top + (vr.height - 330 * k) / 2 + 10 * k : escena.bottom) - sr.top;
        cy = Math.max(libreTop + alto * 0.42 + 6, (libreTop + libreBot) / 2 - alto * 0.1);
        caja.dataset.techo = Math.round(cy - libreTop + alto * 0.42 + 12);
      } else caja.dataset.techo = 0;
      const obj = objetivos(cx, cy, alto);
      const R = alto * 0.62;
      pts = [];
      for (let i = 0; i < N; i++) {
        const t = (i + 0.5) / N, inc = Math.acos(1 - 2 * t), az = Math.PI * (1 + Math.sqrt(5)) * i;
        const o = obj.length ? obj[(Math.random() * obj.length) | 0] : [cx, cy];
        pts.push({ sx: Math.sin(inc) * Math.cos(az), sy: Math.cos(inc), sz: Math.sin(inc) * Math.sin(az), tx: o[0] + (Math.random() - 0.5) * 2, ty: o[1] + (Math.random() - 0.5) * 2, d: Math.random() * 0.35, c: Math.random() < 0.72 ? "#F7C948" : "#FFF3D6", tam: Math.random() < 0.15 ? 3.2 : 2.1, x: cx, y: cy });
      }
      pts.cx = cx; pts.cy = cy; pts.R = R;
    }
    let t0 = performance.now();
    function dibujar(ahora) {
      if (!visible) return;
      const t = (ahora - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const rotY = t * 0.35, rotX = 0.35;
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx_ = Math.cos(rotX), sx_ = Math.sin(rotX);
      for (const p of pts) {
        let x = p.sx * cy + p.sz * sy, z = -p.sx * sy + p.sz * cy, y = p.sy;
        const y2 = y * cx_ - z * sx_, z2 = y * sx_ + z * cx_;
        const per = 1.6 / (1.6 + z2);
        const ex = pts.cx + x * pts.R * per, ey = pts.cy + y2 * pts.R * per;
        const m = suave(clamp((morf - p.d) / 0.65, 0, 1));
        let px = lerp(ex, p.tx + Math.sin(t * 1.3 + p.d * 40) * 1.2 * m, m);
        let py = lerp(ey, p.ty + Math.cos(t * 1.1 + p.d * 30) * 1.2 * m, m);
        const dx = px - raton.x, dy = py - raton.y, dd = dx * dx + dy * dy;
        if (dd < 8100) { const f = (8100 - dd) / 8100 * 26; const l = Math.sqrt(dd) || 1; px += dx / l * f; py += dy / l * f; }
        p.x = lerp(p.x, px, 0.35); p.y = lerp(p.y, py, 0.35);
        ctx.globalAlpha = m > 0.5 ? 0.95 : 0.35 + 0.6 * ((per - 0.6) / 0.9);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.tam, p.tam);
      }
      requestAnimationFrame(dibujar);
    }
    sec.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); raton.x = e.clientX - r.left; raton.y = e.clientY - r.top; });
    sec.addEventListener("pointerleave", () => { raton.x = raton.y = -9999; });
    return {
      armar,
      progreso(v) { morf = v; },
      mostrar(v) { if (v && !visible) { visible = true; requestAnimationFrame(dibujar); } else if (!v) visible = false; },
    };
  }

  /* ---------- historia: estudiante que baja por la pagina ---------- */
  function historia(anilloCtl) {
    const viaje = $("[data-viaje]"), capa = $("[data-viajero]");
    if (!viaje || !capa || !window.Personaje) return null;
    const VB = Personaje.VB, POSES = Personaje.POSES, mezclar = Personaje.mezclar;
    const escenas = $$("[data-escena]").sort((a, b) => +a.dataset.escena - +b.dataset.escena);
    const CONF = [
      { pose: "saludo", mira: -1, saluda: true },
      { pose: "sentadoEstres", pose2: "sentadoTeclea" },
      { pose: "celular", pose2: "pulgar" },
      { pose: "lee", pose2: "pulgar" },
      { pose: "presenta" },
      { pose: "salto", salta: true, confeti: true },
      { pose: "celebra", salta: true, confeti: true },
    ];
    const pj = new Personaje({ piel: "estudiante" });
    capa.appendChild(pj.svg);

    const fijos = [];
    function fijo(piel, estacion, dx, dy, pose, mira) {
      const svg = escenas[estacion];
      const cont = svg.parentElement;
      const p = new Personaje({ piel });
      p.poner(POSES[pose]); p.mira = mira; p.render();
      const div = document.createElement("div");
      div.className = "personaje-fijo";
      div.appendChild(p.svg);
      cont.appendChild(div);
      const f = { p, div, svg, cont, dx, dy, estacion };
      fijos.push(f);
      return f;
    }
    const profe4 = fijo("profesor", 4, -150, 0, "profeSentado", 1);
    const profe5 = fijo("profesor", 5, 196, 0, "parado", -1);
    let profe5Avance = 0;

    function origen(svg, rel) {
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const k = Math.min(r.width / vb.width, r.height / vb.height);
      return {
        x: r.left + (r.width - vb.width * k) / 2 - vb.x * k - rel.left,
        y: r.top + (r.height - vb.height * k) / 2 - vb.y * k - rel.top,
        k,
      };
    }

    let P = [], vh = innerHeight, A = 0.74, viajeTop = 0, viajeIzq = 0;
    function medir() {
      vh = innerHeight;
      const movil = innerWidth < 861;
      A = movil ? 0.74 : 0.7;
      const vr = viaje.getBoundingClientRect();
      const top = vr.top + scrollY;
      viajeTop = top;
      viajeIzq = vr.left + scrollX;
      P = escenas.map((svg, i) => {
        const o = origen(svg, vr);
        const docY = top + o.y;
        const est = svg.closest(".estacion");
        const p = { x: o.x, y: o.y, docY, secTop: est ? est.getBoundingClientRect().top + scrollY : 0, clara: !!(est && est.classList.contains("estacion--clara")) };
        if (i === 0) { p.S = 0; p.din = 0; p.dout = 0.05 * vh; }
        else { p.S = docY - A * vh; p.din = 0.16 * vh; p.dout = (movil ? 0.34 : 0.3) * vh; }
        return p;
      });
      for (let i = 1; i < P.length; i++) {
        const prev = P[i - 1];
        if (P[i].S - P[i].din < prev.S + prev.dout + 120) P[i].S = prev.S + prev.dout + 120 + P[i].din;
      }
      window.__P = P;
      capa.style.width = VB.w * S + "px";
      capa.style.height = VB.h * S + "px";
      fijos.forEach((f) => {
        const cr = f.cont.getBoundingClientRect();
        const o = origen(f.svg, cr);
        f.div.style.width = VB.w * o.k + "px";
        f.div.style.height = VB.h * o.k + "px";
        f.div.style.left = "0px"; f.div.style.top = "0px";
        f.div.style.transform = `translate(${(o.x + f.dx * o.k + VB.x * o.k).toFixed(1)}px, ${(o.y + f.dy * o.k + VB.y * o.k).toFixed(1)}px)`;
      });
      if (anilloCtl && P[0] && anilloCtl.el.parentElement) {
        const er = anilloCtl.el.parentElement.getBoundingClientRect();
        anilloCtl.centrar(P[0].x - (er.left - vr.left), P[0].y - (er.top - vr.top) - 150 * S * ESC_HEROE);
      }
      // Celular: el texto va encima de cada escena, asi que el estudiante NO viaja cruzandolo.
      // Sale caminando por la izquierda y en la escena siguiente baja con el paraguas desde el borde de arriba de su caja.
      M = [];
      if (MOVIL) {
        const fig = 372 * S;
        M = P.map((p, i) => {
          const caja = escenas[i].parentElement, cr = caja.getBoundingClientRect();
          const techo = parseFloat(caja.dataset.techo || "0") || 0;
          const base = top + p.y;
          if (i === 0) return { e0: -1e9, e1: -1e9, s0: base - 0.3 * vh, s1: base - 0.06 * vh, yIni: p.y };
          const cajaTop = cr.top - vr.top;
          return {
            e0: top + cajaTop + techo - 0.92 * vh,
            e1: base - 0.7 * vh,
            s0: base - 0.36 * vh,
            s1: base - 0.12 * vh,
            yIni: Math.min(p.y - 30 * S, cajaTop + techo + fig + 4),
          };
        });
        for (let i = 1; i < M.length; i++) {
          const a = M[i - 1], b = M[i];
          b.e0 = Math.max(b.e0, a.s1 + 8);
          b.e1 = Math.max(b.e1, b.e0 + 0.18 * vh);
          b.s0 = Math.max(b.s0, b.e1 + 0.1 * vh);
          b.s1 = Math.max(b.s1, b.s0 + 0.12 * vh);
        }
      }
      window.__M = M;
    }
    let M = [];

    function estadoMovil(sy) {
      for (let i = M.length - 1; i >= 0; i--) {
        const w = M[i];
        if (sy < w.e0) continue;
        if (sy < w.e1) return { tipo: "entra", i, g: clamp((sy - w.e0) / Math.max(1, w.e1 - w.e0), 0, 1) };
        if (sy < w.s0 || i === M.length - 1) return { tipo: "estacion", i, q: clamp((sy - w.e1) / Math.max(1, w.s0 - w.e1), 0, 1) };
        if (sy < w.s1) return { tipo: "sale", i, v: clamp((sy - w.s0) / Math.max(1, w.s1 - w.s0), 0, 1) };
        return { tipo: "fuera", i };
      }
      return { tipo: "estacion", i: 0, q: 0 };
    }

    /* Como baja (10-nov-2026): al cargar entra flotando con el paraguas; mientras viaja cuelga del paraguas como un
       pendulo y el viento le mueve la cola y el cuerpo segun la velocidad del scroll; al tocar el suelo se aplasta un
       instante (resorte) y levanta polvo. */
    const PIVOTE = 318; // altura del paraguas sobre los pies, en unidades del dibujo
    const intro = { activo: false, t0: 0, dur: 1.45, cayo: false };
    let golpeT = -9, faseAnt = "", gAnt = 0, viento = 0;
    const golpe = (t) => { const d = t - golpeT; return d < 0 || d > 0.7 ? 0 : Math.exp(-7 * d) * Math.cos(d * 17); };
    function aterrizar(t, i, x, y, sy) {
      golpeT = t;
      Aire.polvo(viajeIzq + x, viajeTop + y - sy, !!(P[i] && P[i].clara), S);
    }
    function ubicar(x, y, k, t, pendulo) {
      const g = golpe(t);
      let tr = `translate3d(${(x + VB.x * S).toFixed(1)}px, ${(y + VB.y * S).toFixed(1)}px, 0) scale(${k.toFixed(3)})`;
      if (g) tr += ` scale(${(1 + 0.06 * g).toFixed(4)}, ${(1 - 0.1 * g).toFixed(4)})`;
      if (pendulo) tr += ` translate(0px, ${(-PIVOTE * S).toFixed(1)}px) rotate(${pendulo.toFixed(2)}deg) translate(0px, ${(PIVOTE * S).toFixed(1)}px)`;
      capa.style.transformOrigin = `${(-VB.x * S).toFixed(1)}px ${(-VB.y * S).toFixed(1)}px`;
      capa.style.transform = tr;
    }
    // v = avance del tramo flotando (0 a 1). Devuelve el giro del pendulo en grados.
    function soplar(pose, v, t) {
      pose.cola = (pose.cola || 0) + viento * 20;
      pose.tor += viento * 4; pose.cab -= viento * 3;
      pose.pDy -= Math.max(0, viento) * 5; pose.pTy -= Math.max(0, viento) * 4;
      const borde = Math.min(clamp(v / 0.08, 0, 1), clamp((1 - v) / 0.08, 0, 1));
      return (Math.sin(t * 1.6) * 2.6 - viento * 4.5) * borde;
    }
    function rachas(x, y, sy, vel, i, j) {
      const m = Math.abs(vel);
      if (m < 240 || Math.random() > Math.min(0.75, m / 1800)) return;
      const cuerpo = viajeTop + y - 170 * S;
      Aire.racha(viajeIzq + x, viajeTop + y - sy, vel, cuerpo >= P[j].secTop ? P[j].clara : P[i].clara, S);
    }
    function entrada(t, sy, x0, y0, base) {
      const u = (t - intro.t0) / intro.dur;
      if (u >= 1 || sy > vh * 0.12) { intro.activo = false; capa.style.opacity = ""; return null; }
      const g = clamp(u / 0.8, 0, 1), baja = 1 - Math.pow(1 - g, 3);
      const alto = MOVIL ? 130 * S : Math.min(0.62 * vh, 580);
      const flota = Object.assign({}, POSES.flota);
      flota.paraguas = clamp((0.92 - u) / 0.1, 0, 1);
      flota.pDx += Math.sin(t * 3.1) * 5; flota.pTx += Math.sin(t * 3.1 + 1.4) * 5;
      flota.pDy += Math.cos(t * 3.1) * 3; flota.mTy += Math.sin(t * 2.3) * 4;
      flota.cola = 60 + (1 - baja) * 18;
      flota.sinSombra = g < 0.86 ? 1 : 0;
      const aterriza = suave(clamp((u - 0.78) / 0.22, 0, 1));
      if (!intro.cayo && u >= 0.8) { intro.cayo = true; aterrizar(t, 0, x0, y0, sy); }
      capa.style.opacity = clamp(u / 0.16, 0, 1).toFixed(3);
      return {
        x: x0 + Math.sin(t * 1.6) * 5 * S * (1 - baja), y: y0 - (1 - baja) * alto,
        pose: aterriza > 0 ? mezclar(flota, base, aterriza) : flota,
        mira: aterriza > 0.6 ? base.mira : 1,
        pendulo: Math.sin(t * 2.2) * 3 * (1 - baja),
      };
    }

    let parpadeoHasta = 0, proximoParpadeo = 2;
    const disparados = new Set();
    let ultimoX = null, distancia = 0;

    function estado(sy, t) {
      const n = P.length;
      let i = 0;
      while (i < n - 1 && sy > P[i].S + P[i].dout) i++;
      const p = P[i];
      if (i === 0 || sy >= p.S - p.din) {
        const q = clamp((sy - (p.S - p.din)) / Math.max(1, p.din + p.dout), 0, 1);
        return { tipo: "estacion", i, q, x: p.x, y: p.y };
      }
      const a = P[i - 1], ini = a.S + a.dout, fin = p.S - p.din;
      const u = clamp((sy - ini) / Math.max(1, fin - ini), 0, 1);
      return { tipo: "viaje", i: i - 1, j: i, u };
    }

    function poseEstacion(i, q, t) {
      const c = CONF[i];
      let pose = POSES[c.pose];
      if (c.pose2) pose = mezclar(pose, POSES[c.pose2], suave(clamp((q - 0.5) / 0.25, 0, 1)));
      pose = Object.assign({}, pose);
      if (c.saluda) { pose.mDx += Math.sin(t * 9) * 9; pose.mDy += Math.cos(t * 9) * 4; }
      if (c.salta) {
        const ciclo = (t * 1.25) % 1, h = Math.max(0, Math.sin(ciclo * Math.PI * 2));
        pose.pelY = lerp(-95, -95 - 48, h); pose.pDy = -h * 34; pose.pTy = -h * 28;
        pose.pDx = 12 + h * 6; pose.pTx = -8 - h * 4;
        if (ciclo > 0.5 && ciclo < 0.62) pose.bob = 4;
      } else {
        pose.bob = (pose.bob || 0) + Math.sin(t * 2.2) * 0.8;
      }
      pose.mira = c.mira || 1;
      return pose;
    }

    let oculto = false;
    function ticMovil(sy, t, vel) {
      const e = estadoMovil(sy);
      window.__E = e;
      const p = P[e.i], w = M[e.i];
      let x = p.x, y = p.y, pose, mira = 1, k = 1, ver = true, pendulo = 0;
      if (e.tipo === "estacion") {
        pose = poseEstacion(e.i, e.q, t);
        mira = pose.mira;
        if (e.i === 0) k = ESC_HEROE;
        if (e.i === 0 && intro.activo) {
          const r = entrada(t, sy, x, y, pose);
          if (r) { x = r.x; y = r.y; pose = r.pose; mira = r.mira; pendulo = r.pendulo; }
        }
        const c = CONF[e.i];
        if (c.confeti && e.q > 0.02 && !disparados.has(e.i)) {
          disparados.add(e.i);
          const r = capa.getBoundingClientRect();
          Confeti.disparar(r.left + r.width / 2, r.top + r.height * 0.55, 70, 0.72);
        }
      } else if (e.tipo === "entra") {
        const g = e.g, baja = suave(clamp(g / 0.86, 0, 1));
        y = lerp(w.yIni, p.y, baja);
        x = p.x + Math.sin(t * 1.6) * 6 * S * (1 - baja);
        const flota = Object.assign({}, POSES.flota);
        flota.paraguas = clamp((1 - g) / 0.16, 0, 1);
        flota.pDx += Math.sin(t * 3.1) * 5; flota.pTx += Math.sin(t * 3.1 + 1.4) * 5;
        flota.pDy += Math.cos(t * 3.1) * 3; flota.mTy += Math.sin(t * 2.3) * 4;
        flota.tor += Math.sin(t * 1.6) * 3;
        flota.sinSombra = g < 0.8 ? 1 : 0;
        pendulo = soplar(flota, clamp(g / 0.8, 0, 1), t) * 0.8;
        rachas(x, y, sy, vel, e.i, e.i);
        if (g >= 0.8 && faseAnt === "entra" && gAnt < 0.8) aterrizar(t, e.i, p.x, p.y, sy);
        gAnt = g;
        const aterriza = suave(clamp((g - 0.8) / 0.2, 0, 1));
        pose = aterriza > 0 ? mezclar(flota, poseEstacion(e.i, 0, t), aterriza) : flota;
        mira = aterriza > 0.6 ? (CONF[e.i].mira || 1) : 1;
      } else if (e.tipo === "sale") {
        k = e.i === 0 ? ESC_HEROE : 1;
        const xF = -95 * S * k - 14;
        x = lerp(p.x, xF, sinIO(e.v));
        pose = mezclar(poseEstacion(e.i, 1, t), pj.caminar(Math.abs(x - p.x) / (60 * S * k)), clamp(e.v * 4, 0, 1));
        mira = -1;
      } else {
        ver = false;
        x = -400 * S; pose = POSES.parado;
      }
      disparados.forEach((i) => { if (sy < M[i].e1 - 40) disparados.delete(i); });
      if (ver === oculto) { oculto = !ver; capa.style.visibility = ver ? "" : "hidden"; }
      if (t > proximoParpadeo) { parpadeoHasta = t + 0.12; proximoParpadeo = t + 2.2 + Math.random() * 3; }
      pj.parpadeo = t < parpadeoHasta ? 1 : 0;
      pj.mira = mira;
      pj.pose = pose;
      const pantallaY = viajeTop + y - sy;
      if (ver && pantallaY > -600 && pantallaY < vh + 700) pj.render();
      ubicar(x, y, k, t, pendulo);
      faseAnt = e.tipo;
      profesores(e, e.i > 5 || (e.i === 5 && (e.tipo !== "entra" || e.g > 0.7)), sy, t);
    }

    function profesores(e, nota5, sy, t) {
      const cerca = (k) => P[k] && Math.abs(P[k].docY - sy - vh * 0.5) < vh * 1.6;
      if (profe5.p && cerca(5)) {
        profe5Avance = lerp(profe5Avance, nota5 ? 1 : 0, 0.08);
        const pose5 = mezclar(POSES.parado, POSES.profeNota, suave(profe5Avance));
        pose5.bob = Math.sin(t * 2) * 0.8;
        pose5.objeto = profe5Avance > 0.8 ? "nota" : ""; // el cartel aparece con el brazo ya arriba (no tapa la cara)
        profe5.p.pose = pose5; profe5.p.render();
      }
      if (profe4.p && cerca(4)) {
        const pose4 = Object.assign({}, POSES.profeSentado);
        pose4.cab = Math.sin(t * 0.9) * 3; pose4.mDy += Math.sin(t * 1.3) * 2;
        profe4.p.pose = pose4; profe4.p.render();
      }
    }

    function tic(t, syDado, vel) {
      if (!P.length) return;
      const sy = syDado != null ? syDado : (window.__lenis ? window.__lenis.scroll : scrollY);
      vel = vel || 0;
      viento += (clamp(vel / 2400, -1, 1) - viento) * 0.12;
      if (MOVIL && M.length) { ticMovil(sy, t, vel); return; }
      if (oculto) { oculto = false; capa.style.visibility = ""; }
      const e = estado(sy, t);
      window.__E = e;
      let x, y, pose, mira = 1, pendulo = 0, fase = e.tipo;
      if (e.tipo === "estacion") {
        x = e.x; y = e.y;
        pose = poseEstacion(e.i, e.q, t);
        mira = pose.mira;
        if (e.i === 0 && intro.activo) {
          const r = entrada(t, sy, x, y, pose);
          if (r) { x = r.x; y = r.y; pose = r.pose; mira = r.mira; pendulo = r.pendulo; }
        }
        const c = CONF[e.i];
        if (c.confeti && e.q > 0.02 && !disparados.has(e.i)) {
          disparados.add(e.i);
          const r = capa.getBoundingClientRect();
          Confeti.disparar(r.left + r.width / 2, r.top + r.height * 0.55, 160);
        }
      } else {
        const a = P[e.i], b = P[e.j], u = e.u, UW = 0.09;
        const bordeX = a.x - 95 * S, llegaX = b.x - 95 * S;
        if (u < UW) {
          const v = u / UW;
          fase = "sale";
          x = lerp(a.x, bordeX, sinIO(v)); y = a.y;
          pose = mezclar(poseEstacion(e.i, 1, t), pj.caminar(Math.abs(x - a.x) / (60 * S)), clamp(v * 3, 0, 1));
          mira = -1;
        } else if (u > 1 - UW) {
          const v = (u - (1 - UW)) / UW;
          fase = "llega";
          x = lerp(llegaX, b.x, sinIO(v)); y = b.y;
          if (faseAnt === "flota") aterrizar(t, e.j, x, y, sy);
          const cam = pj.caminar(Math.abs(b.x - x) / (60 * S));
          if (v < 0.25) cam.bob = (cam.bob || 0) + (1 - v / 0.25) * 6;
          pose = mezclar(cam, poseEstacion(e.j, 0, t), suave(clamp((v - 0.55) / 0.45, 0, 1)));
          mira = v > 0.8 ? (CONF[e.j].mira || 1) : 1;
        } else {
          const v = (u - UW) / (1 - 2 * UW);
          fase = "flota";
          x = lerp(bordeX, llegaX, sinIO(v)) + Math.sin(t * 1.6) * 7 * S * Math.sin(Math.PI * v);
          y = lerp(a.y, b.y, v) - 34 * S * Math.sin(Math.PI * Math.min(1, v * 2)) * (1 - v);
          pose = Object.assign({}, POSES.flota);
          pose.paraguas = Math.min(clamp(v / 0.06, 0, 1), clamp((1 - v) / 0.05, 0, 1));
          pose.pDx += Math.sin(t * 3.1) * 5; pose.pTx += Math.sin(t * 3.1 + 1.4) * 5;
          pose.pDy += Math.cos(t * 3.1) * 3; pose.mTy += Math.sin(t * 2.3) * 4;
          pose.tor += Math.sin(t * 1.6) * 3;
          pose.sinSombra = 1;
          pendulo = soplar(pose, v, t);
          rachas(x, y, sy, vel, e.i, e.j);
          if (v < 0.04 || v > 0.96) { pose = mezclar(pj.caminar(0), pose, v < 0.5 ? v / 0.04 : (1 - v) / 0.04); }
          mira = v < 0.45 ? -1 : 1;
        }
      }
      disparados.forEach((k) => { if (sy < P[k].S - P[k].din - 60) disparados.delete(k); });
      if (t > proximoParpadeo) { parpadeoHasta = t + 0.12; proximoParpadeo = t + 2.2 + Math.random() * 3; }
      pj.parpadeo = t < parpadeoHasta ? 1 : 0;
      pj.mira = mira;
      pj.pose = pose;
      const pantallaY = viajeTop + y - sy;
      if (pantallaY > -600 && pantallaY < vh + 700) pj.render();
      let k = 1;
      if (e.tipo === "estacion" && e.i === 0) k = ESC_HEROE;
      else if (e.tipo === "viaje" && e.i === 0) k = lerp(ESC_HEROE, 1, suave(clamp(e.u / 0.3, 0, 1)));
      ubicar(x, y, k, t, pendulo);
      faseAnt = fase;
      profesores(e, e.i >= 5, sy, t);
    }

    return {
      medir, tic, pj,
      // la entrada del inicio: baja flotando con el paraguas, aterriza y saluda (solo si la pagina abre arriba)
      entrar() { intro.activo = true; intro.cayo = false; intro.t0 = performance.now() / 1000; capa.style.opacity = "0"; },
    };
  }

  /* Chat del telefono de la escena 2: cuanto sube para que el mensaje i quede entero sobre el marco de abajo.
     En el celular la conversacion no cabe entera y sube como en WhatsApp; en escritorio cabe y queda en 0. */
  function subidaChat(sec, i) {
    const tel = $(".telefono", sec), chat = $(".telefono__chat", sec), m = $$("[data-msj]", sec)[i];
    if (!tel || !chat || !m) return 0;
    return -Math.max(0, chat.offsetTop + m.offsetTop + m.offsetHeight - (tel.clientHeight - 18));
  }

  /* ---------- escenas animadas con el scroll ---------- */
  function escenas(partic) {
    const NSV = "http://www.w3.org/2000/svg";
    const sec = $$(".estacion");
    const tl = (el, extra) => gsap.timeline({ scrollTrigger: Object.assign({ trigger: el, start: "top 75%", end: "bottom 70%", scrub: 0.6 }, extra || {}) });

    // E1
    const e1 = sec[0];
    if (e1) {
      const pilas = $$(".e1-pila", e1);
      // pilas de libros y hojas (libro = tapa de color con lomo; hoja = papel con un leve desorden fijo)
      const recetas = [["L#2B3CFF", "L#FF5A4E", "h", "h", "h", "h", "h"], ["L#C8F03C", "L#7A4DFF", "L#F7C948", "h", "h", "h", "h", "h"], ["L#FF5A4E", "h", "h", "h", "h", "h"]];
      const xs = [156, 192, 226], desorden = [0.6, -1.8, 1.2, -0.4, 2.1, -1.3, 0.9, -2.2, 1.6];
      const hojas = [];
      const nodo = (tag, at, padre) => { const n = document.createElementNS(NSV, tag); for (const k in at) n.setAttribute(k, at[k]); if (padre) padre.appendChild(n); return n; };
      pilas.forEach((g, k) => {
        let y = -104;
        recetas[k].forEach((tipo, i) => {
          const dx = desorden[(i + k * 3) % desorden.length];
          const item = nodo("g", {}, g);
          if (tipo[0] === "L") {
            const alto = 8, x = xs[k] - 17 + dx * 0.6;
            y -= alto;
            nodo("path", { d: `M${x + 2},${y} h30 q2,0 2,2 v${alto - 4} q0,2 -2,2 h-30 q-2,0 -2,-2 v-${alto - 4} q0,-2 2,-2 z`, fill: tipo.slice(1), stroke: "#16120E", "stroke-width": 1.8 }, item);
            nodo("path", { d: `M${x + 4},${y + alto - 2.6} h26`, stroke: "#FFFAF0", "stroke-width": 1.6, "stroke-linecap": "round", opacity: 0.85 }, item);
            nodo("path", { d: `M${x + 7},${y + 0.9} v${alto - 1.8}`, stroke: "#16120E", "stroke-width": 1.2, opacity: 0.5 }, item);
          } else {
            const alto = 4.2, x = xs[k] - 15 + dx;
            y -= alto;
            nodo("path", { d: `M${x},${y} h30 v${alto} h-30 z`, fill: i % 4 === 3 ? "#FFE7A3" : "#FFFFFF", stroke: "#16120E", "stroke-width": 1.4, "stroke-linejoin": "round" }, item);
          }
          hojas.push(item);
        });
      });
      gsap.set(hojas, { transformBox: "fill-box", transformOrigin: "50% 100%" });
      const t1 = tl(e1);
      t1.from(hojas, { y: -60, opacity: 0, stagger: 0.04, ease: "back.out(1.3)", duration: 0.4 }, 0)
        .fromTo($$(".tui", e1), { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, stagger: 0.18, duration: 0.5, ease: "expo.out" }, 0.1)
        .fromTo($(".e1-aguja-m", e1), { rotation: 0 }, { rotation: 1080, svgOrigin: "-108 -246", ease: "none", duration: 1.6 }, 0)
        .fromTo($(".e1-aguja-h", e1), { rotation: 0 }, { rotation: 90, svgOrigin: "-108 -246", ease: "none", duration: 1.6 }, 0)
        .fromTo($(".e1-circulo", e1), { strokeDasharray: 70, strokeDashoffset: 70 }, { strokeDashoffset: 0, duration: 0.4 }, 0.5);
      gsap.to($(".e1-pantalla", e1), { opacity: 0.55, repeat: -1, yoyo: true, duration: 1.1, ease: "sine.inOut" });
      gsap.to($(".e1-vapor", e1), { y: -6, opacity: 0.15, repeat: -1, yoyo: true, duration: 1.4, ease: "sine.inOut" });
      $$(".tui", e1).forEach((c, i) => gsap.to(c, { yPercent: 14, rotation: "+=" + (i % 2 ? 1.5 : -1.5), repeat: -1, yoyo: true, duration: 2 + i * 0.3, ease: "sine.inOut" }));
    }

    // E2
    const e2 = sec[1];
    if (e2) {
      const msjs = $$("[data-msj]", e2), estado = $("[data-escribiendo]", e2), chat = $(".telefono__chat", e2);
      const t2 = tl(e2, { start: "top 70%", end: "bottom 75%", invalidateOnRefresh: true, onUpdate: (st) => { if (estado) estado.textContent = st.progress > 0.32 && st.progress < 0.5 ? "escribiendo…" : "en línea"; } });
      msjs.forEach((m, i) => {
        const t = i * 0.4 + (i >= 2 ? 0.25 : 0);
        t2.to(m, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "expo.out" }, t);
        if (chat) t2.to(chat, { y: () => subidaChat(e2, i), duration: 0.3, ease: "expo.out" }, t);
      });
      t2.fromTo($$(".flotante", e2), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, stagger: 0.3, duration: 0.3, ease: "expo.out" }, 0.6);
      $$(".flotante", e2).forEach((f, i) => gsap.to(f, { yPercent: i ? -14 : 14, repeat: -1, yoyo: true, duration: 2.2 + i * 0.4, ease: "sine.inOut" }));
      gsap.fromTo($(".telefono", e2), { rotation: 4, y: 40 }, { rotation: -3, y: -20, ease: "none", scrollTrigger: { trigger: e2, start: "top bottom", end: "bottom top", scrub: true } });
    }

    // E3
    const e3 = sec[2];
    if (e3) {
      const barra = $("[data-progreso]", e3), num = $("[data-progreso-num]", e3);
      const obj = { v: 0 };
      const t3 = tl(e3, { start: "top 70%", end: "bottom 80%" });
      t3.from($(".doc-titulo", e3), { scaleX: 0, transformOrigin: "left", duration: 0.3 }, 0)
        .from($(".doc-sub", e3), { scaleX: 0, transformOrigin: "left", duration: 0.3 }, 0.1)
        .from($$(".doc-lineas i", e3), { scaleX: 0, transformOrigin: "left", stagger: 0.06, duration: 0.25 }, 0.2)
        .from($$(".doc-grafico i", e3), { scaleY: 0, stagger: 0.08, duration: 0.3, ease: "back.out(1.3)" }, 0.5)
        .to(obj, { v: 100, duration: 1.2, ease: "none", onUpdate: () => { const v = Math.round(obj.v); if (num) num.textContent = v + "%"; if (barra) barra.style.strokeDashoffset = 201 - 2.01 * v; } }, 0)
        .fromTo($$(".checks li", e3), { opacity: 0, x: 40, scale: 0.92 }, { opacity: 1, x: 0, scale: 1, stagger: 0.18, duration: 0.3, ease: "expo.out" }, 0.15);
      gsap.fromTo($(".documento", e3), { rotation: 6, y: 50 }, { rotation: -2, y: -30, ease: "none", scrollTrigger: { trigger: e3, start: "top bottom", end: "bottom top", scrub: true } });
    }

    // E4
    const e4 = sec[3];
    if (e4) {
      const barras = $$(".e4-barras rect", e4), linea = $(".e4-linea", e4), punto = $(".e4-punto", e4);
      gsap.set(barras, { transformBox: "fill-box", transformOrigin: "50% 100%" });
      const largo = linea ? linea.getTotalLength() : 0;
      const t4 = tl(e4, { start: "top 65%", end: "center 40%" });
      t4.from(barras, { scaleY: 0, stagger: 0.12, duration: 0.4, ease: "back.out(1.2)" }, 0)
        .fromTo(linea, { strokeDasharray: largo, strokeDashoffset: largo }, { strokeDashoffset: 0, duration: 0.5 }, 0.45)
        .from(punto, { scale: 0, svgOrigin: "252 -192", duration: 0.2, ease: "back.out(1.7)" }, 0.9);
    }

    // E5 particulas
    const e5 = sec[4];
    if (e5 && partic) {
      ScrollTrigger.create({ trigger: e5, start: "top bottom", end: "bottom top", onToggle: (st) => partic.mostrar(st.isActive) });
      ScrollTrigger.create({ trigger: e5, start: "top 70%", end: "center 45%", scrub: 0.8, onUpdate: (st) => partic.progreso(st.progress) });
    }
  }

  /* ---------- textos ---------- */
  // El titulo del inicio espera a la entrada (que arranca con la letra ya cargada); los demas suben al llegar a ellos.
  const tituloInicio = { listo: false, tweens: [] };
  function textos() {
    if (window.SplitText) {
      let n = 0;
      $$("[data-partir]").forEach((el) => {
        const heroe = !!el.closest(".heroe"), orden = heroe ? n++ : 0;
        SplitText.create(el, {
          type: "words,chars", mask: "words", autoSplit: true, wordsClass: "pal", charsClass: "car",
          onSplit(self) {
            const tw = gsap.from(self.chars, {
              yPercent: 110, rotation: 6, duration: 0.9, ease: "expo.out", stagger: 0.022, delay: heroe ? 0.05 + orden * 0.14 : 0,
              paused: heroe && !tituloInicio.listo,
              scrollTrigger: heroe ? undefined : { trigger: el, start: "top 90%", once: true },
            });
            if (heroe) tituloInicio.tweens[orden] = tw;
            return tw;
          },
        });
      });
    }
  }

  /* ---------- fondo de color y HUD ---------- */
  function fondoYhud() {
    const fondo = $(".fondo"), hud = $("[data-hud]"), meta = $('meta[name="theme-color"]');
    $$("[data-fondo]").forEach((s) => {
      const color = s.getAttribute("data-fondo"), txt = s.getAttribute("data-hud-txt") || "";
      const ir = () => {
        // 10-nov-2026: cada seccion pinta su color (mundos); este fondo fijo solo se ve al rebotar arriba o abajo, asi que
        // cambia de una vez (animarlo repintaba la pantalla entera en cada cuadro)
        if (fondo) fondo.style.backgroundColor = color;
        if (meta) meta.setAttribute("content", color);
        if (hud && hud.dataset.actual !== txt) { hud.dataset.actual = txt; gsap.to(hud, { duration: 0.6, scrambleText: { text: txt, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 0.6 } }); }
      };
      ScrollTrigger.create({ trigger: s, start: "top 58%", end: "bottom 58%", onEnter: ir, onEnterBack: ir });
    });
    // al llegar al pie, el fondo fijo queda en tinta: si la pagina rebota abajo, no asoma el amarillo del cierre
    const pie = $(".pie");
    if (pie && fondo) ScrollTrigger.create({ trigger: pie, start: "top 70%", onEnter: () => { fondo.style.backgroundColor = "#16120E"; } });
  }

  /* ---------- detalles ---------- */
  function detalles() {
    $$("[data-contar]").forEach((el) => {
      const fin = +el.dataset.contar, suf = el.dataset.sufijo || "", fmt = new Intl.NumberFormat("es-CL"), o = { v: 0 };
      el.textContent = "0" + suf;
      ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => gsap.to(o, { v: fin, duration: 2, ease: "power3.out", onUpdate: () => { el.textContent = fmt.format(Math.round(o.v)) + suf; } }) });
    });
    const logos = $$(".logos li");
    if (logos.length) gsap.from(logos, { y: 18, opacity: 0, stagger: 0.035, duration: 0.7, ease: "expo.out", scrollTrigger: { trigger: ".logos", start: "top 88%", once: true } });
    if (!tactil) {
      $$("[data-inclinar]").forEach((c) => {
        const rx = gsap.quickTo(c, "rotationX", { duration: 0.5, ease: "power3" }), ry = gsap.quickTo(c, "rotationY", { duration: 0.5, ease: "power3" });
        gsap.set(c, { transformPerspective: 800 });
        c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(-((e.clientY - r.top) / r.height - 0.5) * 12); });
        c.addEventListener("pointerleave", () => { rx(0); ry(0); });
      });
      $$("[data-iman]").forEach((b) => {
        const qx = gsap.quickTo(b, "x", { duration: 0.4, ease: "power3" }), qy = gsap.quickTo(b, "y", { duration: 0.4, ease: "power3" });
        b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.25); qy((e.clientY - r.top - r.height / 2) * 0.35); });
        b.addEventListener("pointerleave", () => { qx(0); qy(0); });
      });
    }
    $$(".carta").forEach((c) => gsap.from(c, { y: 70, opacity: 0, rotation: (Math.random() - 0.5) * 6, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 92%", once: true } }));
    $$(".paso").forEach((c, i) => gsap.from(c, { y: 60, opacity: 0, duration: 0.8, delay: i * 0.08, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 90%", once: true } }));
    $$(".burbujas li").forEach((c, i) => gsap.from(c, { y: 24, opacity: 0, scale: 0.96, duration: 0.6, delay: (i % 4) * 0.12, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 92%", once: true } }));
    gsap.fromTo(".marquesina__pista", { xPercent: 0 }, { xPercent: -18, ease: "none", scrollTrigger: { trigger: ".final", start: "top bottom", end: "bottom top", scrub: true } });
    if ($(".muestras__cinta")) gsap.fromTo(".muestras__cinta .cinta__pista", { xPercent: 0 }, { xPercent: -14, ease: "none", scrollTrigger: { trigger: ".muestras__cinta", start: "top bottom", end: "bottom top", scrub: true } });
    // cifras: la linea se traza y cada cifra sube; preguntas: entran en cascada
    const cifras = $(".cifras");
    if (cifras) {
      ScrollTrigger.create({ trigger: cifras, start: "top 86%", once: true, onEnter: () => cifras.classList.add("vista") });
      gsap.from($$(".cifra", cifras), { y: 34, opacity: 0, stagger: 0.1, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: cifras, start: "top 86%", once: true } });
    }
    if ($(".faq")) gsap.from(".faq details", { y: 26, opacity: 0, stagger: 0.07, duration: 0.8, ease: "expo.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".faq", start: "top 86%", once: true } });

    const barra = $("[data-barra]"), wa = $(".wa-flotante");
    let ultimo = 0;
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: (st) => {
      const y = st.scroll();
      if (barra) barra.classList.toggle("oculta", y > 240 && y > ultimo + 2 && $("#menu-movil").hidden);
      if (y < ultimo - 2) barra && barra.classList.remove("oculta");
      if (wa) wa.classList.toggle("visible", y > innerHeight * 0.85);
      ultimo = y;
    } });
  }

  /* ---------- mundos (10-nov-2026): cada seccion pinta su propio color y la que sigue entra por abajo como un
     horizonte curvo y elastico (se hincha al bajar rapido y se aplana al llegar arriba). Antes el color de TODA la
     pantalla cambiaba de golpe con lo anterior todavia a la vista. El fondo lo pone el CSS; aqui solo el horizonte. ---------- */
  function mundos() {
    const lista = [];
    let vh = innerHeight;
    const crear = (sec, color) => {
      const hz = document.createElement("span");
      hz.className = "hz";
      hz.setAttribute("aria-hidden", "true");
      hz.style.backgroundColor = color;
      sec.insertBefore(hz, sec.firstChild);
      lista.push({ el: hz, sec, top: 0, k: 0.62, vivo: false });
    };
    $$("[data-fondo]").forEach((s, i) => {
      const color = s.getAttribute("data-fondo");
      s.style.setProperty("--fondo", color);
      if (i > 0) crear(s, color);
    });
    const pie = $(".pie");
    if (pie) crear(pie, "#16120E");
    raiz.classList.add("mundos");
    const poner = (h) => { h.el.style.transform = "translateY(-25.5%) scaleY(" + h.k.toFixed(4) + ")"; };
    function medir() {
      vh = innerHeight;
      const sy = window.scrollY || 0;
      lista.forEach((h) => { h.top = h.sec.getBoundingClientRect().top + sy; });
    }
    if ("ResizeObserver" in window) {
      let tm = 0;
      const main = $("main");
      if (main) new ResizeObserver(() => { clearTimeout(tm); tm = setTimeout(medir, 60); }).observe(main);
    }
    medir();
    lista.forEach(poner);
    return {
      medir,
      tic(sy, vel, dt) {
        for (const h of lista) {
          const y = h.top - sy; // la linea del horizonte, en la pantalla
          if (y < -0.25 * vh || y > 1.3 * vh) {
            if (h.vivo) { h.vivo = false; h.el.style.willChange = ""; }
            continue;
          }
          if (!h.vivo) { h.vivo = true; h.el.style.willChange = "transform"; }
          const p = clamp(1 - y / vh, 0, 1);
          const meta = clamp(lerp(1, 0.14, Math.pow(p, 1.2)) + clamp(vel / 2800, -0.45, 0.55), 0.02, 1.45);
          h.k += (meta - h.k) * Math.min(1, dt * 7);
          poner(h);
        }
      },
    };
  }

  /* ---------- grano de impresion sobre toda la pagina (el mismo espiritu que el del dibujo) ---------- */
  function grano() {
    try {
      const n = 168, c = document.createElement("canvas");
      c.width = c.height = n;
      const x = c.getContext("2d"), im = x.createImageData(n, n), d = im.data;
      let s = 20261110;
      const azar = () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return ((s >>> 9) & 0xffff) / 65535; };
      for (let i = 0; i < d.length; i += 4) {
        const v = azar();
        d[i] = d[i + 1] = d[i + 2] = v > 0.5 ? 255 : 0;
        d[i + 3] = Math.round(Math.abs(v - 0.5) * 2 * 30);
      }
      x.putImageData(im, 0, 0);
      const g = document.createElement("div");
      g.className = "grano";
      g.setAttribute("aria-hidden", "true");
      g.style.backgroundImage = "url(" + c.toDataURL("image/png") + ")";
      g.style.backgroundSize = Math.round(n / Math.min(2, window.devicePixelRatio || 1)) + "px";
      document.body.appendChild(g);
    } catch (e) { /* sin grano no pasa nada */ }
  }

  /* ---------- despedida: la estudiante vuelve en el cierre y saluda junto al boton ---------- */
  function despedida(quieta) {
    const fin = $(".final");
    if (!fin || !window.Personaje) return null;
    const POSES = Personaje.POSES;
    const caja = document.createElement("div");
    caja.className = "final__amiga";
    caja.setAttribute("aria-hidden", "true");
    const p = new Personaje({ piel: "estudiante" });
    p.poner(POSES.saludo); p.mira = -1; p.render();
    caja.appendChild(p.svg);
    fin.appendChild(caja);
    if (quieta) return null;
    let visible = !("IntersectionObserver" in window), guino = 0, prox = 2;
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(caja);
    return {
      tic(t) {
        if (!visible) return;
        const pose = Object.assign({}, POSES.saludo);
        pose.mDx += Math.sin(t * 9) * 9; pose.mDy += Math.cos(t * 9) * 4;
        pose.bob = Math.sin(t * 2.2) * 0.8;
        if (t > prox) { guino = t + 0.12; prox = t + 2.4 + Math.random() * 3; }
        p.parpadeo = t < guino ? 1 : 0;
        p.mira = -1; p.pose = pose; p.render();
      },
    };
  }

  /* ---------- preguntas: se abren y se cierran con el alto animado (antes saltaban) ---------- */
  function acordeon() {
    // Sin ScrollTrigger.refresh() al terminar: mueve el scroll un instante y hacia reaparecer la barra. Lo que cambia
    // de lugar (el cierre y el pie) lo vuelve a medir mundos() con su ResizeObserver, y Lenis mide solo.
    $$(".faq details").forEach((d) => {
      const s = $("summary", d);
      if (!s) return;
      let anim = null;
      s.addEventListener("click", (e) => {
        e.preventDefault();
        if (anim) anim.kill();
        const abrir = !d.open || d.classList.contains("cerrando");
        const desde = d.offsetHeight;
        const fin = () => { d.style.height = ""; d.classList.remove("cerrando"); anim = null; };
        if (abrir) {
          d.classList.remove("cerrando");
          d.open = true;
          d.style.height = "auto";
          const hasta = d.offsetHeight;
          d.style.height = desde + "px";
          anim = gsap.to(d, { height: hasta, duration: 0.5, ease: "expo.out", onComplete: fin });
          const cuerpo = $$(":scope > :not(summary)", d);
          if (cuerpo.length) gsap.fromTo(cuerpo, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.06, ease: "expo.out", overwrite: true });
        } else {
          d.classList.add("cerrando");
          const hasta = s.offsetHeight + (d.offsetHeight - d.clientHeight);
          anim = gsap.to(d, { height: hasta, duration: 0.3, ease: "power3.out", onComplete: () => { d.open = false; fin(); } });
        }
      });
    });
  }

  /* ---------- proceso: la linea avanza con el scroll y cada paso se enciende (el numero pasa de contorno a lleno) ---------- */
  function procesoVivo() {
    const lista = $(".pasos");
    if (!lista) return;
    const pasos = $$(".paso", lista), n = pasos.length || 1;
    lista.classList.add("pasos--vivo");
    ScrollTrigger.create({
      trigger: lista, start: "top 80%", end: "bottom 58%",
      onUpdate: (st) => {
        lista.style.setProperty("--avance", st.progress.toFixed(3));
        pasos.forEach((p, i) => p.classList.toggle("activo", st.progress >= (i + 0.22) / n));
      },
    });
  }

  /* ---------- menu de arriba: marca la seccion en la que se esta ---------- */
  function espia() {
    $$('.barra__nav a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href");
      const dest = id.length > 1 ? $(id) : null;
      if (!dest) return;
      ScrollTrigger.create({ trigger: dest, start: "top 55%", end: "bottom 55%", onToggle: (st) => a.classList.toggle("actual", st.isActive) });
    });
  }

  /* ---------- muestras: el panel se descubre de arriba hacia abajo al abrirlo ---------- */
  function panelMuestras() {
    const panel = $("[data-muestras-panel]");
    if (!panel || !("MutationObserver" in window)) return;
    new MutationObserver(() => {
      if (panel.hidden) return;
      gsap.fromTo(panel, { clipPath: "inset(-24px -24px 100% -24px)" }, { clipPath: "inset(-24px -24px 0% -24px)", duration: 0.9, ease: "expo.out", clearProps: "clipPath" });
    }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  }

  /* ---------- muestras: un sello redondo que tambien las abre (escritorio; el boton de siempre sigue igual) ---------- */
  function sello() {
    const sec = $("#muestras"), boton = sec && $("[data-muestras-abrir]", sec);
    if (!boton) return;
    const rotulo = () => (($("[data-txt]", boton) || boton).textContent || "").trim().toUpperCase();
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sello";
    b.tabIndex = -1;
    b.setAttribute("aria-hidden", "true");
    b.innerHTML = '<svg viewBox="0 0 200 200"><defs><path id="sello-c" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs>' +
      '<text class="sello__txt"><textPath href="#sello-c" textLength="470" lengthAdjust="spacing"></textPath></text></svg><span class="sello__mas"></span>';
    const tp = b.querySelector("textPath"), svg = b.querySelector("svg");
    const poner = () => {
      const t = rotulo() + " ✦ ", dos = t + t; // el rotulo del boton, dos veces alrededor
      tp.textContent = dos;
      tp.parentNode.style.fontSize = clamp(430 / (dos.length * 0.84), 11, 17).toFixed(1) + "px";
      b.classList.toggle("abierto", boton.getAttribute("aria-expanded") === "true");
    };
    poner();
    if ("MutationObserver" in window) new MutationObserver(poner).observe(boton, { attributes: true, attributeFilter: ["aria-expanded"], childList: true, subtree: true, characterData: true });
    b.addEventListener("click", () => boton.click());
    sec.appendChild(b);
    if (!reducido) gsap.fromTo(svg, { rotation: -40 }, { rotation: 200, ease: "none", transformOrigin: "50% 50%", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  }

  /* ---------- cielo: destellos tenues al fondo de cada mundo, a dos velocidades (dan profundidad a la bajada) ---------- */
  function cielo() {
    const FORMAS = [
      '<path d="M12 0c1.2 6.8 5.2 10.8 12 12-6.8 1.2-10.8 5.2-12 12-1.2-6.8-5.2-10.8-12-12 6.8-1.2 10.8-5.2 12-12z"/>',
      '<circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="3.4"/>',
      '<path d="M12 3v18M3 12h18" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>',
      '<circle cx="12" cy="12" r="5"/>',
    ];
    let s = 20261110;
    const azar = () => { s = (Math.imul(s, 1103515245) + 12345) | 0; return ((s >>> 8) & 0xffff) / 65535; };
    const cielos = [];
    $$(".estacion").forEach((est) => {
      const caja = document.createElement("div");
      caja.className = "cielo";
      caja.setAttribute("aria-hidden", "true");
      const formas = [];
      // Cada destello se mueve solo (un dibujo chico) y no una capa del tamano de la seccion: medido el 10-nov, las
      // capas grandes le costaban cuadros a la pagina.
      [0.07, 0.15].forEach((vel, capa) => {
        const n = capa ? 5 : 6;
        for (let i = 0; i < n; i++) {
          const tam = (capa ? 13 : 22) + azar() * (capa ? 13 : 24), x = 5 + azar() * 90, y = 6 + azar() * 76, rot = Math.round(azar() * 70 - 35);
          caja.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 24 24" width="${tam.toFixed(0)}" height="${tam.toFixed(0)}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;transform:rotate(${rot}deg)">${FORMAS[(azar() * FORMAS.length) | 0]}</svg>`);
          formas.push({ el: caja.lastElementChild, x: x / 100, y: y / 100, tam, vel, rot, oculta: false });
        }
      });
      est.insertBefore(caja, est.firstChild);
      cielos.push({ caja, formas, texto: $(".estacion__texto", est), top: 0, alto: 0 });
    });
    return {
      // Ningun destello queda detras de un texto: los que caen sobre el bloque de texto se apagan (se mide al armar la pagina).
      despejar() {
        const sy = window.scrollY || 0;
        cielos.forEach((c) => {
          const r = c.caja.getBoundingClientRect();
          c.top = r.top + sy; c.alto = r.height;
          if (!c.texto) return;
          const t = c.texto.getBoundingClientRect(), aire = 0.09 * r.height + 26;
          c.formas.forEach((f) => {
            const cx = r.left + f.x * r.width + f.tam / 2, cy = r.top + f.y * r.height + f.tam / 2;
            f.oculta = cx > t.left - 30 - f.tam && cx < t.right + 30 + f.tam && cy > t.top - aire && cy < t.bottom + aire;
            f.el.style.visibility = f.oculta ? "hidden" : "";
          });
        });
      },
      // el paralaje: cada destello se corre unos px segun cuanto le falta a su mundo para estar al medio de la pantalla
      tic(sy, vh) {
        for (const c of cielos) {
          const y = c.top - sy;
          if (y > vh || y + c.alto < 0) continue;
          const centro = y + c.alto / 2 - vh / 2;
          for (const f of c.formas) {
            if (!f.oculta) f.el.style.transform = "translate3d(0," + (centro * f.vel).toFixed(1) + "px,0) rotate(" + f.rot + "deg)";
          }
        }
      },
    };
  }

  /* ---------- version sin movimiento ---------- */
  function estatico() {
    // la posicion se recalcula cuando el diseno ya quedo estable (antes de eso el SVG puede medir otro ancho)
    const ubicar = (ub, svg) => {
      ub();
      window.addEventListener("resize", ub);
      window.addEventListener("load", ub);
      if (document.fonts) document.fonts.ready.then(ub);
      if ("ResizeObserver" in window) new ResizeObserver(() => ub()).observe(svg);
    };
    const escenasSvg = $$("[data-escena]").sort((a, b) => +a.dataset.escena - +b.dataset.escena);
    const poses = ["saludo", "sentadoEstres", "pulgar", "lee", "presenta", "salto", "celebra"];
    const VB = Personaje.VB;
    escenasSvg.forEach((svg, i) => {
      const p = new Personaje({});
      p.poner(Personaje.POSES[poses[i]]); p.mira = i === 0 ? -1 : 1; p.render();
      const d = document.createElement("div"); d.className = "personaje-fijo"; d.appendChild(p.svg); svg.parentElement.appendChild(d);
      const ub = () => {
        const cr = svg.parentElement.getBoundingClientRect(), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = r.width / vb.width;
        d.style.width = VB.w * k + "px"; d.style.height = VB.h * k + "px"; d.style.left = "0px"; d.style.top = "0px";
        d.style.transform = `translate(${r.left - cr.left - vb.x * k + VB.x * k}px, ${r.top - cr.top - vb.y * k + VB.y * k}px)`;
      };
      ubicar(ub, svg);
    });
    const e2 = $$(".estacion")[1], chat = e2 && $(".telefono__chat", e2);
    if (chat) ubicar(() => { chat.style.transform = `translateY(${subidaChat(e2, $$("[data-msj]", e2).length - 1)}px)`; }, chat);
    const profes = [[4, -150, "profeSentado", 1], [5, 196, "profeNota", -1]];
    profes.forEach(([i, dx, pose, mira]) => {
      const svg = escenasSvg[i];
      if (!svg) return;
      const p = new Personaje({ piel: "profesor" });
      p.poner(Personaje.POSES[pose]); p.mira = mira; p.render();
      const d = document.createElement("div"); d.className = "personaje-fijo"; d.appendChild(p.svg); svg.parentElement.appendChild(d);
      const ub = () => {
        const cr = svg.parentElement.getBoundingClientRect(), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = r.width / vb.width;
        d.style.width = VB.w * k + "px"; d.style.height = VB.h * k + "px"; d.style.left = "0px"; d.style.top = "0px";
        d.style.transform = `translate(${r.left - cr.left + (dx - vb.x) * k + VB.x * k}px, ${r.top - cr.top - vb.y * k + VB.y * k}px)`;
      };
      ubicar(ub, svg);
    });
    // el color de cada seccion ya lo pinta mundos() (10-nov-2026), con el horizonte quieto
    $$("[data-contar]").forEach((el) => { el.textContent = new Intl.NumberFormat("es-CL").format(+el.dataset.contar) + (el.dataset.sufijo || ""); });
    const cifras = $(".cifras");
    if (cifras) cifras.classList.add("vista");
    $$(".paso").forEach((p) => p.classList.add("activo"));
  }

  /* ---------- arranque ---------- */
  function iniciar() {
    enlacesWA();
    calcularEscala();
    menu();
    if (!window.gsap) { raiz.classList.add("listo"); return; }
    gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, SplitText);
    // Si la pagina todavia no se pinto (carga rapida), el texto y el boton del inicio tambien entran en cascada; si ya
    // se pinto, quedan como estan: nadie los ve desaparecer para volver a entrar.
    const sinPintar = !reducido && (window.scrollY || 0) < 40 &&
      !(window.performance && performance.getEntriesByType && performance.getEntriesByType("paint").length);
    if (sinPintar) raiz.classList.add("entrando");
    grano();
    const mun = mundos();
    if (reducido) {
      estatico(); despedida(true); sello();
      const quieto = cielo();
      const asentar = () => { mun.medir(); quieto.despejar(); };
      asentar();
      window.addEventListener("load", asentar);
      window.addEventListener("resize", asentar);
      raiz.classList.add("listo");
      return;
    }

    let lenis = null;
    const alAncla = (ir) => $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const dest = $(id);
      if (!dest) return;
      e.preventDefault();
      ir(dest);
    }));
    if (window.Lenis && !tactil) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      alAncla((dest) => lenis.scrollTo(dest, { offset: -70, duration: 1.6 }));
    } else {
      // celular: los enlaces a una seccion bajan con suavidad (antes saltaban de golpe)
      alAncla((dest) => window.scrollTo({ top: dest.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" }));
    }

    const an = anillo();
    const part = particulas();
    const his = historia(an);
    const desp = despedida(false);
    textos();
    fondoYhud();
    escenas(part);
    detalles();
    acordeon();
    procesoVivo();
    espia();
    panelMuestras();
    sello();
    const cie = cielo();

    const rearmar = () => {
      calcularEscala();
      if (an) an.armar();
      if (part) part.armar();
      ScrollTrigger.refresh();
      if (his) his.medir();
      mun.medir();
      cie.despejar();
    };
    ScrollTrigger.addEventListener("refresh", () => { if (his) his.medir(); mun.medir(); cie.despejar(); });
    let ancho = innerWidth, alto = innerHeight, tm = 0;
    window.addEventListener("resize", () => {
      if (innerWidth === ancho && Math.abs(innerHeight - alto) < 140) return;
      ancho = innerWidth; alto = innerHeight;
      clearTimeout(tm); tm = setTimeout(rearmar, 180);
    });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { rearmar(); });
    window.addEventListener("load", () => setTimeout(rearmar, 60));

    /* La entrada (10-nov-2026): con la letra ya cargada (o a los 0,7 s), el titulo sube letra por letra, la estudiante
       baja flotando con el paraguas, aterriza y saluda, y el anillo se abre a su alrededor. Si la pagina abre a media
       altura (un ancla, volver atras) no hay entrada: todo queda puesto. */
    let entro = false;
    const entrar = () => {
      if (entro) return;
      entro = true;
      const arriba = (window.scrollY || 0) < 40;
      tituloInicio.listo = true;
      raiz.classList.add("listo");
      if (!arriba) {
        tituloInicio.tweens.forEach((tw) => tw && tw.progress(1));
        if (an) an.entrar(0);
        return;
      }
      tituloInicio.tweens.forEach((tw) => tw && tw.play());
      if (his) { his.medir(); his.entrar(); }
      if (an) an.entrar(1.05);
      if (raiz.classList.contains("entrando")) {
        gsap.timeline({ defaults: { ease: "expo.out" } })
          .from(".heroe__bajada", { y: 26, opacity: 0, duration: 0.9 }, 0.45)
          .from(".heroe__acciones", { y: 22, opacity: 0, duration: 0.9 }, 0.58)
          .from(".chips li", { y: 14, opacity: 0, duration: 0.7, stagger: 0.06 }, 0.74)
          .from(".heroe__pista", { opacity: 0, duration: 0.8 }, 1.35);
      }
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(entrar));
    setTimeout(entrar, 700);

    let previo = performance.now();
    gsap.ticker.add(() => {
      const ahora = performance.now(), t = ahora / 1000, dt = Math.min(0.05, (ahora - previo) / 1000);
      previo = ahora;
      const sy = lenis ? lenis.scroll : (window.scrollY || 0);
      const vel = Vel.tic(sy, ahora);
      if (his) his.tic(t, sy, vel);
      if (an) an.tic(dt, Math.min(260, Math.abs(vel) * 0.1), sy);
      mun.tic(sy, vel, dt);
      if (!tactil) cie.tic(sy, window.innerHeight); // en el celular los destellos quedan quietos: ahi cada cuadro cuenta
      if (desp) desp.tic(t);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
