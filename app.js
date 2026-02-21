/**
 * EducaProject Landing v6 (2026 Futurista)
 * Edita CONFIG para personalizar: WhatsApp, ubicación, enlaces, etc.
 */
const CONFIG = {
  brand: "EducaProject",
  whatsappNumber: "51965148374",      // Formato internacional sin + ni espacios
  whatsappDisplay: "+51 965 148 374",
  location: "Lince, Perú",
  facebookUrl: "https://www.facebook.com/profile.php?id=61550076753079",
  tiktokUrl: "https://www.tiktok.com/@educaproject_",
  instagramUrl: "https://www.instagram.com/educaproject_peru/",

  // Indicadores (opcional). Si no deseas números, deja en "—".
  stat1Value: "300+",
  stat1Label: "Proyectos elaborados",
  stat2Value: "5+",
  stat2Label: "Formatos de citación",
  stat3Value: "4",
  stat3Label: "Etapas de desarrollo",
};

function buildWhatsAppUrl(message) {
  const base = `https://wa.me/${CONFIG.whatsappNumber}`;
  const text = encodeURIComponent(message || "");
  return `${base}?text=${text}`;
}

function bindConfig() {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const key = el.getAttribute("data-bind");
    if (CONFIG[key] !== undefined) el.textContent = CONFIG[key];
  });

  document.querySelectorAll("[data-href]").forEach((el) => {
    const key = el.getAttribute("data-href");
    if (CONFIG[key]) el.setAttribute("href", CONFIG[key]);
  });
}

function bindWhatsAppLinks() {
  const waEls = document.querySelectorAll("[data-wa-message]");
  waEls.forEach((el) => {
    const msg = el.getAttribute("data-wa-message") || "";
    el.setAttribute("href", buildWhatsAppUrl(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
}

function setupMobileMenu() {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    menu.hidden = expanded;
  });

  // Cerrar al hacer clic en un link
  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    });
  });

  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      btn.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    }
  });
}

function setupReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("revealed"));
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          obs.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  els.forEach((el) => obs.observe(el));
}

function setupAccordions() {
  document.querySelectorAll(".accordion__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const panelId = btn.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      btn.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  });
}

function setupFaqSearch() {
  const input = document.getElementById("faqSearchInput");
  const hint = document.getElementById("faqSearchHint");
  const items = Array.from(document.querySelectorAll("[data-faq-item]"));
  if (!input || !hint || items.length === 0) return;

  const updateHint = (visibleCount) => {
    const total = items.length;
    hint.textContent = `${visibleCount}/${total}`;
  };

  const filter = () => {
    const q = (input.value || "").toString().trim().toLowerCase();
    if (!q) {
      items.forEach((it) => (it.style.display = ""));
      updateHint(items.length);
      return;
    }

    let visible = 0;
    items.forEach((it) => {
      const text = it.textContent.toLowerCase();
      const match = text.includes(q);
      it.style.display = match ? "" : "none";
      if (match) visible += 1;
    });

    updateHint(visible);
  };

  input.addEventListener("input", filter);
  updateHint(items.length);
}

function setupForm() {
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const program = (data.get("program") || "").toString().trim();
    const stage = (data.get("stage") || "").toString().trim();
    const date = (data.get("date") || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();

    const lines = [
      `Hola, soy ${name}.`,
      program ? `Programa/Carrera: ${program}` : null,
      stage ? `Etapa: ${stage}` : null,
      date ? `Fecha tentativa: ${date}` : null,
      message ? `Situación: ${message}` : null,
      "",
      "¿Podemos coordinar el desarrollo de mi investigación? Gracias.",
    ].filter(Boolean);

    const url = buildWhatsAppUrl(lines.join("\n"));
    window.open(url, "_blank", "noopener");
  });
}

function setupCopyWhatsApp() {
  const btn = document.getElementById("copyWhatsAppBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const text = CONFIG.whatsappDisplay || "";
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copiado ✓";
      setTimeout(() => (btn.textContent = "Copiar número"), 1400);
    } catch {
      alert(`Copia este número: ${text}`);
    }
  });
}

function setupToTop() {
  const btn = document.getElementById("toTop");
  if (!btn) return;

  const onScroll = () => {
    if (window.scrollY > 500) btn.classList.add("show");
    else btn.classList.remove("show");
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}


function setupYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
}

function setupScrollProgress() {
  const bar = document.getElementById("scrollProgress");
  if (!bar) return;

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
}

function setupScrollSpy() {
  const nav = document.getElementById("navLinks");
  if (!nav || !("IntersectionObserver" in window)) return;

  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const targets = links
    .map((a) => {
      const id = a.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      return el ? { id, el } : null;
    })
    .filter(Boolean);

  if (targets.length === 0) return;

  const clear = () => {
    links.forEach((a) => {
      a.classList.remove("active");
      a.removeAttribute("aria-current");
    });
  };

  const setActive = (id) => {
    clear();
    const a = links.find((x) => x.getAttribute("href") === `#${id}`);
    if (a) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  };

  const obs = new IntersectionObserver(
    (entries) => {
      // Elegir el que esté más visible
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));

      if (visible.length > 0) {
        setActive(visible[0].target.id);
      }
    },
    {
      root: null,
      threshold: [0.2, 0.35, 0.5, 0.65],
      rootMargin: "-20% 0px -55% 0px",
    }
  );

  targets.forEach(({ el }) => obs.observe(el));
}





function setupGSAP() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    setupReveal();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const handled = new Set();

  // Cards en grids → stagger en cascada
  document.querySelectorAll(".cards--3").forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll(".card"));
    cards.forEach((c) => handled.add(c));
    gsap.fromTo(cards,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: "power2.out",
        scrollTrigger: { trigger: grid, start: "top 85%" } }
    );
  });

  // Pasos del timeline → slide desde la izquierda
  const steps = Array.from(document.querySelectorAll(".step"));
  if (steps.length) {
    steps.forEach((s) => handled.add(s));
    gsap.fromTo(steps,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.15, ease: "back.out(1.2)",
        scrollTrigger: { trigger: steps[0].parentElement, start: "top 80%" } }
    );
  }

  // Entregables → stagger
  const delivs = Array.from(document.querySelectorAll(".deliverable"));
  if (delivs.length) {
    delivs.forEach((d) => handled.add(d));
    gsap.fromTo(delivs,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: "power2.out",
        scrollTrigger: { trigger: delivs[0].parentElement, start: "top 80%" } }
    );
  }

  // Team cards → stagger con scale
  const teamCards = Array.from(document.querySelectorAll(".team-card"));
  if (teamCards.length) {
    teamCards.forEach((t) => handled.add(t));
    gsap.fromTo(teamCards,
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: "power2.out",
        scrollTrigger: { trigger: teamCards[0].parentElement, start: "top 82%" } }
    );
  }

  // Resto de [data-reveal]
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    if (handled.has(el)) return;
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" } }
    );
  });

  // CountUp animado en stats
  const statVals = document.querySelectorAll(".stat__val[data-countup]");
  statVals.forEach((el) => {
    const end = parseFloat(el.getAttribute("data-countup")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const obj = { val: 0 };
    gsap.to(obj, {
      val: end,
      duration: 1.8,
      ease: "power2.out",
      onUpdate() { el.textContent = Math.round(obj.val) + suffix; },
      scrollTrigger: { trigger: el.closest(".stats"), start: "top 82%", once: true },
    });
  });

  // Parallax del hero background
  const heroBg = document.querySelector(".hero__bg");
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 28, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.2 },
    });
  }
}

function setupTyped() {
  if (typeof Typed === "undefined") return;
  const el = document.getElementById("typedTarget");
  if (!el) return;
  new Typed("#typedTarget", {
    strings: ["tesis", "proyectos de investigación", "trabajos de grado", "artículos científicos", "informes académicos", "tesinas"],
    typeSpeed: 60,
    backSpeed: 35,
    backDelay: 1600,
    startDelay: 900,
    loop: true,
    showCursor: true,
    cursorChar: "|",
  });
}

function setupSwiper() {
  if (typeof Swiper === "undefined") return;
  if (!document.querySelector(".testimonials-swiper")) return;
  new Swiper(".testimonials-swiper", {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,
    autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    breakpoints: {
      640: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
    },
  });
}

function setupParticles() {
  if (typeof particlesJS === "undefined") return;
  if (!document.getElementById("hero-particles")) return;
  particlesJS("hero-particles", {
    particles: {
      number: { value: 110, density: { enable: true, value_area: 800 } },
      color: { value: ["#C9A84C", "#4A7BC8", "#ffffff"] },
      shape: { type: "circle" },
      opacity: { value: 0.55, random: true, anim: { enable: true, speed: 1.2, opacity_min: 0.15, sync: false } },
      size: { value: 3.2, random: true, anim: { enable: true, speed: 2, size_min: 0.8, sync: false } },
      line_linked: { enable: true, distance: 150, color: "#4A7BC8", opacity: 0.22, width: 1 },
      move: { enable: true, speed: 1.8, direction: "none", random: true, straight: false, out_mode: "out", bounce: false },
    },
    interactivity: {
      detect_on: "canvas",
      events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
    },
    retina_detect: true,
  });
}

function setupTilt() {
  if (typeof VanillaTilt === "undefined") return;
  const cards = document.querySelectorAll(".card");
  VanillaTilt.init(cards, {
    max: 6,
    speed: 500,
    glare: true,
    "max-glare": 0.12,
    gyroscope: false,
    scale: 1.02,
  });
}

function setupNavScroll() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 60) nav.classList.add("nav--scrolled");
    else nav.classList.remove("nav--scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

document.addEventListener("DOMContentLoaded", () => {
  bindConfig();
  bindWhatsAppLinks();
  setupMobileMenu();
  setupScrollProgress();
  setupScrollSpy();
  setupNavScroll();
  setupGSAP();
  setupAccordions();
  setupFaqSearch();
  setupForm();
  setupCopyWhatsApp();
  setupToTop();
  setupYear();
  setupTyped();
  setupSwiper();
  setupParticles();
  setupTilt();
});
