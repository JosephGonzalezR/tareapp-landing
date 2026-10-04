(function () {
  "use strict";

  const CONFIG = {
    whatsappNumero: "56971478131",
    whatsappVisible: "+56 9 7147 8131",
  };

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const suave = (t) => t * t * (3 - 2 * t);
  const sinIO = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tactil = window.matchMedia("(hover: none)").matches;

  /* ---------- WhatsApp ---------- */
  function enlacesWA() {
    $$("[data-wa]").forEach((a) => {
      const msg = a.getAttribute("data-wa");
      a.href = "https://wa.me/" + CONFIG.whatsappNumero + (msg ? "?text=" + encodeURIComponent(msg) : "");
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
    const cerrar = () => { b.setAttribute("aria-expanded", "false"); m.hidden = true; document.body.style.overflow = ""; };
    b.addEventListener("click", () => {
      const abierto = b.getAttribute("aria-expanded") === "true";
      if (abierto) { cerrar(); return; }
      b.setAttribute("aria-expanded", "true"); m.hidden = false; document.body.style.overflow = "hidden";
      if (!reducido) gsap.from(m.querySelectorAll("nav a"), { yPercent: 60, opacity: 0, stagger: 0.04, duration: 0.5, ease: "power3.out" });
    });
    m.addEventListener("click", (e) => { if (e.target.closest("a")) cerrar(); });
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
    return {
      armar,
      tic(dt, impulso) {
        if (!enVista) return;
        vel = lerp(vel, impulso, 0.08);
        giro = (giro + dt * (18 + vel)) % 360;
        giros.forEach((g) => g.style.setProperty("--giro", giro.toFixed(2) + "deg"));
      },
      centrar(x, y) { cont.style.left = x + "px"; cont.style.top = y + "px"; },
      el: cont,
    };
  }

  /* ---------- particulas 7,0 ---------- */
  function particulas() {
    const cv = $("[data-particulas]");
    if (!cv) return null;
    const sec = cv.parentElement;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, pts = [], N = 0, morf = 0, visible = false, raton = { x: -9999, y: -9999 };
    function objetivos(cx, cy, alto) {
      const off = document.createElement("canvas");
      const ow = Math.round(alto * 1.9), oh = Math.round(alto * 1.15);
      off.width = ow; off.height = oh;
      const o = off.getContext("2d");
      o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
      o.font = `900 ${alto}px Archivo, "Arial Black", sans-serif`;
      if ("fontStretch" in o) o.fontStretch = "expanded";
      o.fillText("7,0", ow / 2, oh / 2 + alto * 0.04);
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
      // celular: el 7,0 va arriba de la escena y los personajes abajo; el estudiante baja recien bajo el 7,0
      const alto = movil ? Math.min(escena.width * 0.44, escena.height * 0.27, 210) : Math.min(escena.width * 0.62, H * 0.42, 420);
      const cx = movil ? escena.left - sr.left + escena.width / 2 : escena.left - sr.left + escena.width * 0.52;
      const cy = movil ? escena.top - sr.top + alto * 0.42 + 6 : H * 0.42;
      caja.dataset.techo = movil ? Math.round(alto * 0.84 + 18) : 0;
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

    let P = [], vh = innerHeight, A = 0.74, viajeTop = 0;
    function medir() {
      vh = innerHeight;
      const movil = innerWidth < 861;
      A = movil ? 0.74 : 0.7;
      const vr = viaje.getBoundingClientRect();
      const top = vr.top + scrollY;
      viajeTop = top;
      P = escenas.map((svg, i) => {
        const o = origen(svg, vr);
        const docY = top + o.y;
        const p = { x: o.x, y: o.y, docY };
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
    function ticMovil(sy, t) {
      const e = estadoMovil(sy);
      window.__E = e;
      const p = P[e.i], w = M[e.i];
      let x = p.x, y = p.y, pose, mira = 1, k = 1, ver = true;
      if (e.tipo === "estacion") {
        pose = poseEstacion(e.i, e.q, t);
        mira = pose.mira;
        if (e.i === 0) k = ESC_HEROE;
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
      capa.style.transformOrigin = `${(-VB.x * S).toFixed(1)}px ${(-VB.y * S).toFixed(1)}px`;
      capa.style.transform = `translate3d(${(x + VB.x * S).toFixed(1)}px, ${(y + VB.y * S).toFixed(1)}px, 0) scale(${k.toFixed(3)})`;
      profesores(e, e.i > 5 || (e.i === 5 && (e.tipo !== "entra" || e.g > 0.7)), sy, t);
    }

    function profesores(e, nota5, sy, t) {
      const cerca = (k) => P[k] && Math.abs(P[k].docY - sy - vh * 0.5) < vh * 1.6;
      if (profe5.p && cerca(5)) {
        profe5Avance = lerp(profe5Avance, nota5 ? 1 : 0, 0.08);
        const pose5 = mezclar(POSES.parado, POSES.profeNota, suave(profe5Avance));
        pose5.bob = Math.sin(t * 2) * 0.8;
        profe5.p.pose = pose5; profe5.p.render();
      }
      if (profe4.p && cerca(4)) {
        const pose4 = Object.assign({}, POSES.profeSentado);
        pose4.cab = Math.sin(t * 0.9) * 3; pose4.mDy += Math.sin(t * 1.3) * 2;
        profe4.p.pose = pose4; profe4.p.render();
      }
    }

    function tic(t) {
      if (!P.length) return;
      const sy = window.__lenis ? window.__lenis.scroll : scrollY;
      if (MOVIL && M.length) { ticMovil(sy, t); return; }
      if (oculto) { oculto = false; capa.style.visibility = ""; }
      const e = estado(sy, t);
      window.__E = e;
      let x, y, pose, mira = 1;
      if (e.tipo === "estacion") {
        x = e.x; y = e.y;
        pose = poseEstacion(e.i, e.q, t);
        mira = pose.mira;
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
          x = lerp(a.x, bordeX, sinIO(v)); y = a.y;
          pose = mezclar(poseEstacion(e.i, 1, t), pj.caminar(Math.abs(x - a.x) / (60 * S)), clamp(v * 3, 0, 1));
          mira = -1;
        } else if (u > 1 - UW) {
          const v = (u - (1 - UW)) / UW;
          x = lerp(llegaX, b.x, sinIO(v)); y = b.y;
          const cam = pj.caminar(Math.abs(b.x - x) / (60 * S));
          if (v < 0.25) cam.bob = (cam.bob || 0) + (1 - v / 0.25) * 6;
          pose = mezclar(cam, poseEstacion(e.j, 0, t), suave(clamp((v - 0.55) / 0.45, 0, 1)));
          mira = v > 0.8 ? (CONF[e.j].mira || 1) : 1;
        } else {
          const v = (u - UW) / (1 - 2 * UW);
          x = lerp(bordeX, llegaX, sinIO(v)) + Math.sin(t * 1.6) * 7 * S * Math.sin(Math.PI * v);
          y = lerp(a.y, b.y, v) - 34 * S * Math.sin(Math.PI * Math.min(1, v * 2)) * (1 - v);
          pose = Object.assign({}, POSES.flota);
          pose.paraguas = Math.min(clamp(v / 0.06, 0, 1), clamp((1 - v) / 0.05, 0, 1));
          pose.pDx += Math.sin(t * 3.1) * 5; pose.pTx += Math.sin(t * 3.1 + 1.4) * 5;
          pose.pDy += Math.cos(t * 3.1) * 3; pose.mTy += Math.sin(t * 2.3) * 4;
          pose.tor += Math.sin(t * 1.6) * 3;
          pose.sinSombra = 1;
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
      capa.style.transformOrigin = `${(-VB.x * S).toFixed(1)}px ${(-VB.y * S).toFixed(1)}px`;
      capa.style.transform = `translate3d(${(x + VB.x * S).toFixed(1)}px, ${(y + VB.y * S).toFixed(1)}px, 0) scale(${k.toFixed(3)})`;
      profesores(e, e.i >= 5, sy, t);
    }

    return { medir, tic, pj };
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
      const msjs = $$("[data-msj]", e2), estado = $("[data-escribiendo]", e2);
      const t2 = tl(e2, { start: "top 70%", end: "bottom 75%", onUpdate: (st) => { if (estado) estado.textContent = st.progress > 0.32 && st.progress < 0.5 ? "escribiendo…" : "en línea"; } });
      msjs.forEach((m, i) => t2.to(m, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "expo.out" }, i * 0.4 + (i >= 2 ? 0.25 : 0)));
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
  function textos() {
    if (window.SplitText) {
      $$("[data-partir]").forEach((el) => {
        const heroe = !!el.closest(".heroe");
        SplitText.create(el, {
          type: "words,chars", mask: "words", autoSplit: true, wordsClass: "pal", charsClass: "car",
          onSplit(self) {
            return gsap.from(self.chars, {
              yPercent: 110, rotation: 6, duration: 0.9, ease: "expo.out", stagger: 0.022, delay: heroe ? 0.15 : 0,
              scrollTrigger: heroe ? undefined : { trigger: el, start: "top 85%", once: true },
            });
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
        gsap.to(fondo, { backgroundColor: color, duration: 0.55, ease: "power2.out", overwrite: true });
        if (meta) meta.setAttribute("content", color);
        if (hud && hud.dataset.actual !== txt) { hud.dataset.actual = txt; gsap.to(hud, { duration: 0.6, scrambleText: { text: txt, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 0.6 } }); }
      };
      ScrollTrigger.create({ trigger: s, start: "top 58%", end: "bottom 58%", onEnter: ir, onEnterBack: ir });
    });
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
    $$("[data-fondo]").forEach((sec) => {
      const c = sec.getAttribute("data-fondo");
      sec.style.backgroundColor = c; sec.style.boxShadow = "0 0 0 100vmax " + c; sec.style.clipPath = "inset(0 -100vmax)";
    });
    $$("[data-contar]").forEach((el) => { el.textContent = new Intl.NumberFormat("es-CL").format(+el.dataset.contar) + (el.dataset.sufijo || ""); });
  }

  /* ---------- arranque ---------- */
  function iniciar() {
    enlacesWA();
    calcularEscala();
    menu();
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, SplitText);
    if (reducido) { estatico(); return; }

    let lenis = null;
    if (window.Lenis && !tactil) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const dest = $(id);
        if (!dest) return;
        e.preventDefault();
        lenis.scrollTo(dest, { offset: -70, duration: 1.6 });
      }));
    }

    const an = anillo();
    const part = particulas();
    const his = historia(an);
    textos();
    fondoYhud();
    escenas(part);
    detalles();

    const rearmar = () => {
      calcularEscala();
      if (an) an.armar();
      if (part) part.armar();
      ScrollTrigger.refresh();
      if (his) his.medir();
    };
    ScrollTrigger.addEventListener("refresh", () => { if (his) his.medir(); });
    let ancho = innerWidth, alto = innerHeight, tm = 0;
    window.addEventListener("resize", () => {
      if (innerWidth === ancho && Math.abs(innerHeight - alto) < 140) return;
      ancho = innerWidth; alto = innerHeight;
      clearTimeout(tm); tm = setTimeout(rearmar, 180);
    });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { rearmar(); });
    window.addEventListener("load", () => setTimeout(rearmar, 60));

    if (his) gsap.from(his.pj.svg, { y: 36, scale: 0.9, opacity: 0, transformOrigin: "50% 92%", duration: 1.1, ease: "expo.out", delay: 0.35 });
    let previo = performance.now();
    gsap.ticker.add(() => {
      const ahora = performance.now(), t = ahora / 1000, dt = Math.min(0.05, (ahora - previo) / 1000);
      previo = ahora;
      if (his) his.tic(t);
      if (an) an.tic(dt, Math.min(260, Math.abs(lenis ? lenis.velocity * 6 : 0)));
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
