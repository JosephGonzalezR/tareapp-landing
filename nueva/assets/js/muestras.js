/* Muestras de trabajos (desplegable). Orden de Joseph 4-oct-2026: muestras en IMAGEN, no descargables,
   sin nombres de alumnos y solo a la vista cuando el estudiante las quiera ver.
   Las imagenes van como fondo (no hay <img> que guardar o arrastrar), se cargan recien al abrir y traen
   la marca de agua en los pixeles: un pantallazo siempre es posible, por eso la marca. */
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
    window.gsap.fromTo($$(".muestra", grilla), { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.05, overwrite: true });
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

  /* ---------- visor ---------- */
  const lienzo = $("[data-visor-lienzo]", visor);
  const marco = $("[data-visor-marco]", visor);
  const titulo = $("[data-visor-titulo]", visor);
  const prog = $("[data-visor-soft]", visor);
  const cuenta = $("[data-visor-cuenta]", visor);
  const btnAmpliar = $("[data-visor-ampliar]", visor);
  let lista = [], idx = 0, origen = null, ampliado = false;

  function ajustar() {
    const d = lista[idx];
    if (!d) return;
    const w = +d.dataset.w, h = +d.dataset.h;
    if (ampliado) {
      const ancho = Math.max(w, marco.clientWidth * 1.6);
      lienzo.style.width = Math.round(ancho) + "px";
      lienzo.style.height = Math.round(ancho * h / w) + "px";
    } else {
      lienzo.style.width = "";
      lienzo.style.height = "";
    }
  }

  function mostrar(i) {
    idx = (i + lista.length) % lista.length;
    const d = lista[idx];
    ampliado = false;
    marco.classList.remove("ampliado");
    btnAmpliar.setAttribute("aria-pressed", "false");
    lienzo.style.backgroundImage = 'url("' + d.dataset.g + '")';
    lienzo.setAttribute("aria-label", d.dataset.titulo);
    titulo.textContent = d.dataset.titulo;
    prog.textContent = d.dataset.soft;
    cuenta.textContent = (idx + 1) + " / " + lista.length;
    marco.scrollTo(0, 0);
    ajustar();
    [idx + 1, idx - 1].forEach((k) => {
      const v = lista[(k + lista.length) % lista.length];
      if (v) { const im = new Image(); im.src = v.dataset.g; }
    });
  }

  function abrirVisor(card) {
    const g = card.closest('[role="tabpanel"]');
    lista = $$("[data-g]", g);
    origen = card;
    visor.hidden = false;
    document.documentElement.classList.add("visor-abierto");
    if (window.__lenis) window.__lenis.stop();
    mostrar(lista.indexOf($("[data-g]", card)));
    $("[data-visor-cerrar]", visor).focus();
    if (!reducido && window.gsap) window.gsap.fromTo(lienzo, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "expo.out" });
  }

  function cerrarVisor() {
    visor.hidden = true;
    document.documentElement.classList.remove("visor-abierto");
    lienzo.style.backgroundImage = "";
    if (window.__lenis) window.__lenis.start();
    if (origen) origen.focus();
  }

  $$(".muestra", sec).forEach((c) => c.addEventListener("click", () => abrirVisor(c)));
  $("[data-visor-cerrar]", visor).addEventListener("click", cerrarVisor);
  $("[data-visor-ant]", visor).addEventListener("click", () => mostrar(idx - 1));
  $("[data-visor-sig]", visor).addEventListener("click", () => mostrar(idx + 1));
  btnAmpliar.addEventListener("click", () => {
    ampliado = !ampliado;
    marco.classList.toggle("ampliado", ampliado);
    btnAmpliar.setAttribute("aria-pressed", String(ampliado));
    ajustar();
    if (ampliado) marco.scrollTo((marco.scrollWidth - marco.clientWidth) / 2, 0);
  });
  marco.addEventListener("click", (e) => { if (e.target === marco && !ampliado) cerrarVisor(); });
  window.addEventListener("resize", () => { if (!visor.hidden) ajustar(); });
  document.addEventListener("keydown", (e) => {
    if (visor.hidden) return;
    if (e.key === "Escape") cerrarVisor();
    if (e.key === "ArrowRight") mostrar(idx + 1);
    if (e.key === "ArrowLeft") mostrar(idx - 1);
    if (e.key === "Tab") {
      const f = $$("button", visor).filter((b) => b.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  // deslizar con el dedo para pasar de una muestra a otra (solo sin ampliar)
  let x0 = null, y0 = null;
  marco.addEventListener("touchstart", (e) => { if (!ampliado && e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
  marco.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) mostrar(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // sin menu de "guardar imagen", sin arrastrar y sin seleccionar
  ["contextmenu", "dragstart", "selectstart"].forEach((ev) => {
    panel.addEventListener(ev, (e) => { if (e.target.closest(".muestra")) e.preventDefault(); });
    visor.addEventListener(ev, (e) => e.preventDefault());
  });

  // el enlace "Muestras" del menu (o llegar con #muestras) la abre
  $$('a[href="#muestras"]').forEach((a) => a.addEventListener("click", () => abrir(true)));
  if (location.hash === "#muestras") abrir(true);
})();
