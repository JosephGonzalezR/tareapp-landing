/* Muestras de trabajos (desplegable). Orden de Joseph 4-oct-2026: muestras en IMAGEN, no descargables, sin nombres de
   alumnos, solo a la vista cuando el estudiante las quiera ver (01:24) y abiertas en un VISOR TIPO PDF con el informe
   COMPLETO y los datos personales tachados (02:19).
   Las paginas van como fondo (no hay <img> que guardar o arrastrar), se cargan recien al acercarse y traen la marca de
   agua en los pixeles: un pantallazo siempre es posible, por eso la marca. */
(function () {
  "use strict";
  const sec = document.getElementById("muestras");
  if (!sec) return;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const boton = $("[data-muestras-abrir]", sec);
  const panel = $("[data-muestras-panel]", sec);
  const tabs = $$('[role="tab"]', sec);
  const grillas = $$('[role="tabpanel"]', sec);
  const visor = $("[data-visor]");
  if (!boton || !panel || !visor) return;

  const refrescar = () => {
    if (window.__lenis && window.__lenis.resize) window.__lenis.resize();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  };

  function cargar(grilla) {
    $$("[data-m]", grilla).forEach((d) => {
      if (!d.style.backgroundImage) d.style.backgroundImage = 'url("' + d.dataset.m + '")';
    });
  }

  function entrar(grilla) {
    if (reducido || !window.gsap) return;
    window.gsap.fromTo($$(".informe, .muestra", grilla), { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.04, overwrite: true });
  }

  const visible = () => grillas.find((g) => !g.hidden) || grillas[0];

  function abrir(estado) {
    const ab = typeof estado === "boolean" ? estado : boton.getAttribute("aria-expanded") !== "true";
    boton.setAttribute("aria-expanded", String(ab));
    const t = $("[data-txt]", boton);
    if (t) t.textContent = ab ? "Ocultar muestras" : "Ver muestras";
    panel.hidden = !ab;
    if (ab) {
      const g = visible();
      cargar(g);
      entrar(g);
    }
    requestAnimationFrame(refrescar);
    setTimeout(refrescar, 450);
  }

  function elegir(tab, foco) {
    tabs.forEach((t) => {
      const sel = t === tab;
      t.setAttribute("aria-selected", String(sel));
      t.tabIndex = sel ? 0 : -1;
    });
    grillas.forEach((g) => { g.hidden = g.id !== tab.getAttribute("aria-controls"); });
    const g = visible();
    cargar(g);
    entrar(g);
    if (foco) tab.focus();
    tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducido ? "auto" : "smooth" });
    requestAnimationFrame(refrescar);
  }

  boton.addEventListener("click", () => abrir());
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => elegir(t));
    t.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); elegir(tabs[j], true); }
    });
  });

  /* ---------- visor tipo PDF ---------- */
  const hojas = $("[data-visor-hojas]", visor);
  const titulo = $("[data-visor-titulo]", visor);
  const prog = $("[data-visor-soft]", visor);
  const cuenta = $("[data-visor-pag]", visor);
  const pctTxt = $("[data-visor-zoom]", visor);
  let paginas = [], zoom = 1, origen = null, obs = null;
  const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];

  function anchoBase() {
    // "ajustar": la pagina mas ancha cabe en el visor, sin pasar de 920 px (como el visor de PDF)
    return Math.min(hojas.clientWidth - 28, 920);
  }

  function aplicarZoom() {
    const w = Math.round(anchoBase() * zoom) + "px";
    paginas.forEach((p) => { p.el.style.width = w; });
    if (pctTxt) pctTxt.textContent = Math.round(zoom * 100) + " %";
  }

  function cargarHoja(p) {
    if (!p.cargada) { p.el.style.backgroundImage = 'url("' + p.src + '")'; p.cargada = true; }
  }

  function paginaActual() {
    const medio = hojas.scrollTop + hojas.clientHeight * 0.35;
    let k = 0;
    paginas.forEach((p, i) => { if (p.el.offsetTop <= medio) k = i; });
    return k;
  }

  function actualizarCuenta() {
    cuenta.textContent = "Página " + (paginaActual() + 1) + " de " + paginas.length;
  }

  function irA(k) {
    k = Math.max(0, Math.min(paginas.length - 1, k));
    hojas.scrollTo({ top: paginas[k].el.offsetTop - 14, behavior: reducido ? "auto" : "smooth" });
  }

  function abrirDoc(datos, desde) {
    origen = desde;
    hojas.innerHTML = "";
    const pila = document.createElement("div");
    pila.className = "visor__pila";
    hojas.appendChild(pila);
    paginas = datos.paginas.map((p, i) => {
      const el = document.createElement("div");
      el.className = "hoja";
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", datos.titulo + ", página " + (i + 1));
      el.style.aspectRatio = p.w + " / " + p.h;
      pila.appendChild(el);
      return { el, src: p.src, w: p.w, h: p.h, cargada: false };
    });
    titulo.textContent = datos.titulo;
    prog.textContent = datos.soft || "";
    zoom = 1;
    visor.hidden = false;
    document.documentElement.classList.add("visor-abierto");
    if (window.__lenis) window.__lenis.stop();
    hojas.scrollTop = 0;
    aplicarZoom();
    actualizarCuenta();
    if (obs) obs.disconnect();
    if ("IntersectionObserver" in window) {
      obs = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) { const p = paginas.find((q) => q.el === en.target); if (p) cargarHoja(p); }
      }), { root: hojas, rootMargin: "900px 0px" });
      paginas.forEach((p) => obs.observe(p.el));
    } else {
      paginas.forEach(cargarHoja);
    }
    $("[data-visor-cerrar]", visor).focus();
    if (!reducido && window.gsap) window.gsap.fromTo(hojas, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" });
  }

  function cerrarVisor() {
    visor.hidden = true;
    document.documentElement.classList.remove("visor-abierto");
    if (obs) obs.disconnect();
    hojas.innerHTML = "";
    paginas = [];
    if (window.__lenis) window.__lenis.start();
    if (origen) origen.focus();
  }

  function datosDe(card) {
    if (card.dataset.doc) {
      const tam = JSON.parse(card.dataset.paginas);
      return {
        titulo: card.dataset.titulo, soft: card.dataset.soft,
        paginas: tam.map((t, i) => ({ src: card.dataset.doc + "p" + String(i + 1).padStart(2, "0") + ".webp", w: t[0], h: t[1] })),
      };
    }
    const g = $("[data-g]", card);
    return { titulo: g.dataset.titulo, soft: g.dataset.soft, paginas: [{ src: g.dataset.g, w: +g.dataset.w, h: +g.dataset.h }] };
  }

  $$(".informe, .muestra", sec).forEach((c) => c.addEventListener("click", () => abrirDoc(datosDe(c), c)));
  $("[data-visor-cerrar]", visor).addEventListener("click", cerrarVisor);
  $("[data-visor-mas]", visor).addEventListener("click", () => {
    const k = paginaActual();
    zoom = ZOOMS.find((z) => z > zoom + 0.01) || zoom;
    aplicarZoom(); irA(k);
  });
  $("[data-visor-menos]", visor).addEventListener("click", () => {
    const k = paginaActual();
    zoom = [...ZOOMS].reverse().find((z) => z < zoom - 0.01) || zoom;
    aplicarZoom(); irA(k);
  });
  $("[data-visor-ajustar]", visor).addEventListener("click", () => { const k = paginaActual(); zoom = 1; aplicarZoom(); irA(k); });
  hojas.addEventListener("scroll", () => { if (!visor.hidden) actualizarCuenta(); }, { passive: true });
  window.addEventListener("resize", () => { if (!visor.hidden) aplicarZoom(); });
  document.addEventListener("keydown", (e) => {
    if (visor.hidden) return;
    const k = paginaActual();
    if (e.key === "Escape") cerrarVisor();
    else if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); irA(k + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); irA(k - 1); }
    else if (e.key === "+" || e.key === "=") $("[data-visor-mas]", visor).click();
    else if (e.key === "-") $("[data-visor-menos]", visor).click();
    else if (e.key === "Tab") {
      const f = $$("button", visor).filter((b) => b.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  // sin menu de "guardar imagen", sin arrastrar y sin seleccionar
  ["contextmenu", "dragstart", "selectstart"].forEach((ev) => {
    panel.addEventListener(ev, (e) => { if (e.target.closest(".muestra, .informe")) e.preventDefault(); });
    visor.addEventListener(ev, (e) => e.preventDefault());
  });

  // el enlace "Muestras" del menu (o llegar con #muestras) la abre
  $$('a[href="#muestras"]').forEach((a) => a.addEventListener("click", () => abrir(true)));
  if (location.hash === "#muestras") abrir(true);
})();
