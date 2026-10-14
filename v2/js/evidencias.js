/* Evidencias (13-oct-2026): trabajos completos de /referencias/ de Tareapp Ecuador, Mexico y Panama en un visor tipo PDF.
   Es el visor de las muestras de la portada (/v2/js/muestras.js) sin el desplegable: las tarjetas estan siempre a la vista.
   Las paginas van como fondo (no hay <img> que guardar o arrastrar), se cargan recien al acercarse y traen la marca de agua
   en los pixeles: un pantallazo siempre es posible, por eso la marca. */
(function () {
  "use strict";
  const sec = document.getElementById("trabajos");
  const visor = document.querySelector("[data-visor]");
  if (!sec || !visor) return;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tarjetas = $$(".obra", sec);

  // portadas: recien cuando la tarjeta se acerca a la pantalla
  function portada(t) {
    const p = $("[data-m]", t);
    if (p && !p.style.backgroundImage) p.style.backgroundImage = 'url("' + p.dataset.m + '")';
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { portada(en.target); io.unobserve(en.target); }
    }), { rootMargin: "600px 0px" });
    tarjetas.forEach((t) => io.observe(t));
  } else {
    tarjetas.forEach(portada);
  }

  /* ---------- visor tipo PDF ---------- */
  const hojas = $("[data-visor-hojas]", visor);
  const titulo = $("[data-visor-titulo]", visor);
  const prog = $("[data-visor-soft]", visor);
  const cuenta = $("[data-visor-pag]", visor);
  const pctTxt = $("[data-visor-zoom]", visor);
  let paginas = [], zoom = 1, origen = null, obs = null;
  const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];

  function anchoBase() {
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
  }

  function cerrarVisor() {
    visor.hidden = true;
    document.documentElement.classList.remove("visor-abierto");
    if (obs) obs.disconnect();
    hojas.innerHTML = "";
    paginas = [];
    if (origen) origen.focus();
  }

  function datosDe(card) {
    const tam = JSON.parse(card.dataset.paginas);
    return {
      titulo: card.dataset.titulo, soft: card.dataset.soft,
      paginas: tam.map((t, i) => ({ src: card.dataset.doc + "p" + String(i + 1).padStart(2, "0") + ".webp", w: t[0], h: t[1] })),
    };
  }

  tarjetas.forEach((c) => c.addEventListener("click", () => abrirDoc(datosDe(c), c)));
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
    sec.addEventListener(ev, (e) => { if (e.target.closest(".obra")) e.preventDefault(); });
    visor.addEventListener(ev, (e) => e.preventDefault());
  });

  // llegar con #trabajos abre la pagina en esa seccion (el navegador ya baja); #trabajo=<id> abre ese trabajo
  const m = location.hash.match(/^#trabajo=([a-z0-9-]+)$/);
  if (m) {
    const c = tarjetas.find((t) => t.dataset.doc.indexOf("/" + m[1] + "/") >= 0);
    if (c) abrirDoc(datosDe(c), c);
  }
})();
