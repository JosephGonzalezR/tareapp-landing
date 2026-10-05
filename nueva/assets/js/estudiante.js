/* Personaje ilustrado con esqueleto (cinematica inversa de 2 huesos).
   Coordenadas locales: origen en el suelo entre los pies, y negativa hacia arriba, mirando a la derecha.
   4-oct-2026: dibujo con sombra de celula (luz de arriba y de frente), manos con pulgar, grano de impresion
   (patron #ags-grano, compartido con las escenas) y lineas interiores mas finas que el contorno. */
(function (global) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const XL = "http://www.w3.org/1999/xlink";
  const TINTA = "#16120E";
  const VB = { x: -160, y: -370, w: 320, h: 395 };
  let UID = 0;

  const PIELES = {
    estudiante: {
      piel: "#EDB08A", pielSombra: "#D38E66", pielMedia: "#E29E78", mejilla: "#F08F80",
      pelo: "#2B1A12", peloLuz: "#5A3A28",
      polera: "#FFC83D", poleraSombra: "#EBA51F", poleraLuz: "#FFE08A", puno: "#F2B02A",
      pantalon: "#26305E", pantalonSombra: "#1B2347",
      zapato: "#FFFFFF", suela: "#FF5A4E",
      mochila: "#FF5A4E", mochilaSombra: "#D7443A", colet: "#2B3CFF",
      cola: true, lentes: false, mochilaVisible: true, profe: false,
    },
    profesor: {
      piel: "#C98B63", pielSombra: "#AE7350", pielMedia: "#BB7E58", mejilla: "#D9826E",
      pelo: "#D9D4CC", peloLuz: "#F1EDE6",
      polera: "#3B4A7A", poleraSombra: "#2C385F", poleraLuz: "#4F5F93", puno: "#334172",
      pantalon: "#3A3A44", pantalonSombra: "#2A2A32",
      zapato: "#5A3A28", suela: "#3A2518",
      mochila: "#000", mochilaSombra: "#000", colet: "#000",
      cola: false, lentes: true, mochilaVisible: false, profe: true,
    },
  };

  const MED = { muslo: 46, canilla: 46, brazo: 33, antebrazo: 32, cadera: -95 };

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* Grano de impresion: motas oscuras y claras con semilla fija (sale igual en cada carga). */
  function granoURL(n) {
    const c = document.createElement("canvas");
    c.width = c.height = n;
    const x = c.getContext("2d");
    if (!x) return "";
    const im = x.createImageData(n, n), d = im.data;
    let s = 20261004;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let i = 0; i < d.length; i += 4) {
      const r = rnd();
      if (r < 0.17) { d[i] = 22; d[i + 1] = 18; d[i + 2] = 14; d[i + 3] = 28 + rnd() * 50; }
      else if (r > 0.91) { d[i] = 255; d[i + 1] = 250; d[i + 2] = 240; d[i + 3] = 30 + rnd() * 56; }
    }
    x.putImageData(im, 0, 0);
    return c.toDataURL("image/png");
  }

  function asegurarGrano() {
    if (document.getElementById("ags-grano")) return;
    const url = granoURL(96);
    if (!url) return;
    const svg = el("svg", { width: 0, height: 0, "aria-hidden": "true", focusable: "false", style: "position:absolute;width:0;height:0;overflow:hidden" });
    const pat = el("pattern", { id: "ags-grano", patternUnits: "userSpaceOnUse", width: 64, height: 64 }, el("defs", {}, svg));
    const img = el("image", { x: 0, y: 0, width: 64, height: 64, preserveAspectRatio: "none", href: url }, pat);
    img.setAttributeNS(XL, "xlink:href", url);
    (document.body || document.documentElement).appendChild(svg);
  }

  function ik(rx, ry, tx, ty, a, b, signo) {
    let dx = tx - rx, dy = ty - ry;
    let d = Math.hypot(dx, dy);
    const max = a + b - 0.01, min = Math.abs(a - b) + 0.01;
    if (d > max) { tx = rx + dx / d * max; ty = ry + dy / d * max; d = max; }
    if (d < min) d = min;
    const th = Math.atan2(ty - ry, tx - rx);
    const al = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
    return { jx: rx + a * Math.cos(th + signo * al), jy: ry + a * Math.sin(th + signo * al), tx, ty };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function mezclar(p, q, t) {
    if (t <= 0) return Object.assign({}, p);
    if (t >= 1) return Object.assign({}, q);
    const o = {};
    for (const k in p) {
      const v = p[k], w = q[k];
      if (typeof v === "number" && typeof w === "number") o[k] = lerp(v, w, t);
      else if (typeof v === "number" && w === undefined) o[k] = lerp(v, 0, t);
      else o[k] = t < 0.5 ? v : (w === undefined ? v : w);
    }
    for (const k in q) if (!(k in o)) o[k] = typeof q[k] === "number" ? lerp(0, q[k], t) : (t < 0.5 ? "" : q[k]);
    return o;
  }

  const B = { pelX: 0, pelY: -95, tor: 0, cab: 0, pDx: 12, pDy: 0, pTx: -8, pTy: 0, cola: 0, sudor: 0, gorro: 0, paraguas: 0, bob: 0 };
  const P = (o) => Object.assign({}, B, o);
  const POSES = {
    parado: P({ mDx: 8, mDy: 62, mTx: -2, mTy: 62, ojos: "normal", boca: "sonrisa", objeto: "" }),
    saludo: P({ tor: -2, cab: -4, mDx: 50, mDy: -36, signoD: 1, mTx: -2, mTy: 62, ojos: "feliz", boca: "abierta", objeto: "" }),
    sentadoEstres: P({ pelX: -14, pelY: -58, tor: 8, cab: 14, mDx: 63, mDy: 6, mTx: 14, mTy: -58, signoD: 1, manoTArriba: 1, pDx: 30, pTx: 18, ojos: "preocupado", boca: "ondulada", objeto: "", sudor: 1 }),
    sentadoTeclea: P({ pelX: -14, pelY: -58, tor: 10, cab: 12, mDx: 52, mDy: 10, mTx: 44, mTy: 14, pDx: 30, pTx: 18, ojos: "abajo", boca: "plana", objeto: "" }),
    celular: P({ tor: -1, cab: 14, mDx: 36, mDy: 30, mTx: 10, mTy: 16, ojos: "abajo", boca: "sonrisa", objeto: "celular" }),
    pulgar: P({ tor: -2, cab: -2, mDx: 34, mDy: 2, mTx: -2, mTy: 62, ojos: "feliz", boca: "abierta", objeto: "pulgar" }),
    lee: P({ tor: -2, cab: 10, mDx: 26, mDy: 14, mTx: -4, mTy: 60, ojos: "abajo", boca: "sonrisa", objeto: "hoja" }),
    presenta: P({ tor: -4, cab: -6, mDx: 56, mDy: -30, mTx: 14, mTy: 30, pDx: 16, pTx: -10, ojos: "normal", boca: "abierta", objeto: "puntero" }),
    salto: P({ pelY: -150, tor: -4, cab: -8, mDx: 56, mDy: -42, signoD: 1, mTx: -56, mTy: -34, pDx: 22, pDy: -46, pTx: -14, pTy: -40, ojos: "feliz", boca: "abierta", cola: 18, objeto: "" }),
    flota: P({ pelY: -100, tor: 3, cab: -6, mDx: 34, mDy: 16, mTx: 6, mTy: -62, signoT: -1, pDx: 12, pDy: -6, pTx: -9, pTy: 4, ojos: "feliz", boca: "abierta", cola: 60, objeto: "paraguas", paraguas: 1 }),
    celebra: P({ tor: -3, cab: -8, mDx: 54, mDy: -40, signoD: 1, mTx: -54, mTy: -34, ojos: "feliz", boca: "abierta", objeto: "diploma", gorro: 1 }),
    profeSentado: P({ pelX: -14, pelY: -58, tor: 2, mDx: 30, mDy: 28, mTx: 22, mTy: 32, pDx: 30, pTx: 18, ojos: "normal", boca: "plana", objeto: "carpeta" }),
    profeNota: P({ tor: -2, cab: -4, mDx: 56, mDy: -42, signoD: 1, mTx: 2, mTy: 40, ojos: "feliz", boca: "sonrisa", objeto: "nota" }),
  };

  /* Mano en coordenadas de la mano: el antebrazo llega por -x y los dedos apuntan a +x; el pulgar va por -y. */
  const MANO = "M-2.5,-7 C4,-9.2 11.5,-7.4 13,-1.6 C14.4,3.8 10.2,8.6 3.4,8.6 C-1.8,8.6 -4.6,5.8 -4.6,1.2 C-4.6,-2.6 -4.2,-5.8 -2.5,-7 Z";
  const PULGAR = "M0.6,-6.4 C0.8,-12.4 6.6,-14.6 9,-11.2 C10.4,-9.2 9,-7 6.8,-6";

  class Personaje {
    constructor(opciones) {
      const o = Object.assign({ piel: "estudiante" }, opciones || {});
      asegurarGrano();
      this.c = PIELES[o.piel];
      this.uid = "pj" + (++UID);
      this._nc = 0;
      this.pose = Object.assign({}, POSES.parado);
      this.mira = 1;
      this.parpadeo = 0;
      this.svg = el("svg", { viewBox: `${VB.x} ${VB.y} ${VB.w} ${VB.h}`, class: "personaje", "aria-hidden": "true", focusable: "false" });
      this.defs = el("defs", {}, this.svg);
      const rub = el("radialGradient", { id: this.uid + "-rubor" }, this.defs);
      el("stop", { offset: "0", "stop-color": this.c.mejilla, "stop-opacity": 0.9 }, rub);
      el("stop", { offset: "1", "stop-color": this.c.mejilla, "stop-opacity": 0 }, rub);
      this.raiz = el("g", {}, this.svg);
      this.sombra = el("ellipse", { cx: 2, cy: 2, rx: 40, ry: 6, fill: TINTA, opacity: 0.18 }, this.raiz);
      this.cuerpo = el("g", {}, this.raiz);
      this._construir();
      this.render();
    }

    /* recorte para la sombra de celula de una forma */
    _recorte(d) {
      const id = `${this.uid}-r${++this._nc}`;
      el("path", { d }, el("clipPath", { id }, this.defs));
      return `url(#${id})`;
    }

    /* forma con contorno + sombra y luz recortadas dentro + grano */
    _forma(parent, d, relleno, ancho, extra) {
      const x = extra || {};
      const g = el("g", {}, parent);
      el("path", { d, fill: relleno }, g);
      if (x.sombra || x.luz) {
        const cg = el("g", { "clip-path": this._recorte(d) }, g);
        if (x.sombra) el("path", { d: x.sombra, fill: x.colorSombra }, cg);
        if (x.luz) el("path", { d: x.luz, fill: x.colorLuz, opacity: x.opLuz || 1 }, cg);
      }
      if (x.grano !== false) el("path", { d, fill: "url(#ags-grano)", opacity: x.grano || 1 }, g);
      el("path", { d, fill: "none", stroke: TINTA, "stroke-width": ancho, "stroke-linejoin": "round" }, g);
      return g;
    }

    _limb(parent, color, ancho, sombra) {
      const g = el("g", {}, parent);
      const comun = { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
      const borde = el("path", Object.assign({ stroke: TINTA, "stroke-width": ancho + 7 }, comun), g);
      const relleno = el("path", Object.assign({ stroke: color, "stroke-width": ancho }, comun), g);
      const capas = [borde, relleno];
      if (sombra) capas.push(el("path", Object.assign({ stroke: sombra.color, "stroke-width": sombra.ancho, transform: `translate(${sombra.dx},${sombra.dy})` }, comun), g));
      capas.push(el("path", Object.assign({ stroke: "url(#ags-grano)", "stroke-width": ancho }, comun), g));
      return { g, borde, relleno, capas };
    }

    _mano(parent, color) {
      const g = el("g", {}, parent);
      const pulgar = el("path", { d: PULGAR, fill: color, stroke: TINTA, "stroke-width": 2.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      el("path", { d: MANO, fill: color, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, g);
      el("path", { d: "M5,-2.2 C7.6,-1.6 9.4,0 10,2.4", fill: "none", stroke: TINTA, "stroke-width": 1.4, "stroke-linecap": "round", opacity: 0.45 }, g);
      return { g, pulgar };
    }

    _construir() {
      const c = this.c, cu = this.cuerpo;
      this.piernaT = this._limb(cu, c.pantalonSombra, 17);
      this.zapatoT = el("g", {}, cu);
      this.brazoT = this._limb(cu, c.poleraSombra, 13);
      this.objetoT = el("g", {}, cu);
      this.manoT = this._mano(cu, c.pielSombra);
      this.piernaD = this._limb(cu, c.pantalon, 17, { color: c.pantalonSombra, ancho: 6, dx: -3.6, dy: 0.8 });
      this.zapatoD = el("g", {}, cu);

      this.torso = el("g", {}, cu);
      const to = this.torso;
      if (c.mochilaVisible) {
        const dm = "M-44,-150 q-6,2 -7,14 l-3,40 q0,10 10,11 l20,1 l4,-66 z";
        this._forma(to, dm, c.mochila, 3.4, { sombra: "M-62,-116 L-26,-112 L-26,-78 L-62,-78 Z", colorSombra: c.mochilaSombra, luz: "M-53,-146 C-50,-150 -44,-152 -38,-150 L-40,-140 C-46,-142 -50,-140 -53,-134 Z", colorLuz: "#FF8A7E" });
        el("path", { d: "M-53,-111 q0,-5 5,-5 l9,0 l-1,25 l-9,0 q-4,0 -4,-5 z", fill: c.mochilaSombra, stroke: TINTA, "stroke-width": 2.2, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-52,-124 l17,1", stroke: TINTA, "stroke-width": 1.6, "stroke-linecap": "round", opacity: 0.7 }, to);
        el("path", { d: "M-49,-124 l-2,7", stroke: TINTA, "stroke-width": 2.2, "stroke-linecap": "round" }, to);
      }
      if (c.profe) {
        const dp = "M-27,-166 C-34,-160 -36,-130 -34,-96 Q-33,-88 -24,-88 L30,-88 Q38,-88 38,-96 C39,-128 36,-160 28,-166 Q2,-174 -27,-166 Z";
        this._forma(to, dp, c.polera, 3.6, { sombra: "M-44,-180 L-12,-178 C-20,-154 -22,-124 -16,-84 L-44,-84 Z", colorSombra: c.poleraSombra, luz: "M16,-170 C28,-168 36,-158 37,-144 C32,-152 24,-160 12,-164 Z", colorLuz: c.poleraLuz });
        el("path", { d: "M-6,-168 L6,-140 L16,-168", fill: "#F4EFE6", stroke: TINTA, "stroke-width": 2.6, "stroke-linejoin": "round" }, to);
        el("path", { d: "M6,-150 l-4,6 l4,26 l4,-26 z", fill: "#E8533F", stroke: TINTA, "stroke-width": 2.2, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-6,-168 L4,-126 M16,-168 L8,-126", stroke: TINTA, "stroke-width": 2, fill: "none", opacity: 0.55 }, to);
        el("path", { d: "M17,-140 l13,-1", stroke: TINTA, "stroke-width": 2, "stroke-linecap": "round" }, to);
        el("path", { d: "M19,-140.4 l2.6,-5 l2.8,3.6 l2.8,-3.8 l1.8,5 z", fill: "#FFF3D6", stroke: TINTA, "stroke-width": 1.4, "stroke-linejoin": "round" }, to);
        el("circle", { cx: 7, cy: -112, r: 2.2, fill: TINTA }, to);
        el("circle", { cx: 7.5, cy: -100, r: 2.2, fill: TINTA }, to);
      } else {
        const dt = "M-28,-164 C-36,-158 -38,-128 -36,-100 Q-36,-90 -26,-89 L32,-89 Q40,-90 40,-100 C41,-128 38,-158 30,-164 Q2,-176 -28,-164 Z";
        this._forma(to, dt, c.polera, 3.6, { sombra: "M-44,-180 L-14,-178 C-22,-156 -24,-126 -18,-84 L-44,-84 Z", colorSombra: c.poleraSombra, luz: "M14,-170 C28,-168 38,-156 39,-140 C33,-150 26,-160 12,-164 Z", colorLuz: c.poleraLuz });
        el("path", { d: "M-34,-104 Q2,-98 39,-104 L39,-98 Q39,-90 31,-90 L-27,-90 Q-35,-90 -35,-98 Z", fill: c.puno }, to);
        el("path", { d: "M-35,-104 Q2,-98 39,-104", fill: "none", stroke: TINTA, "stroke-width": 1.8, "stroke-linecap": "round", opacity: 0.6 }, to);
        el("path", { d: "M-8,-124 Q6,-121 22,-124 L24,-104 L-10,-104 Z", fill: c.poleraSombra, stroke: TINTA, "stroke-width": 2.2, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-5,-120 Q6,-117.6 19,-120", fill: "none", stroke: TINTA, "stroke-width": 1.3, "stroke-dasharray": "2.4 2.4", opacity: 0.55 }, to);
        el("path", { d: "M-24,-166 Q-4,-150 22,-166 Q4,-158 -24,-166 Z", fill: c.poleraSombra, stroke: TINTA, "stroke-width": 2.4, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-2,-158 l-3,16 M10,-158 l3,15", stroke: TINTA, "stroke-width": 2, "stroke-linecap": "round" }, to);
        el("path", { d: "M-7.4,-143 l1,4.6 l3.4,-0.6 l-0.8,-4.6 z M11.2,-144 l1.2,4.6 l3.4,-0.8 l-1.2,-4.4 z", fill: "#FFF3D6", stroke: TINTA, "stroke-width": 1.5, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-31,-140 C-30,-128 -31,-116 -33,-106", fill: "none", stroke: TINTA, "stroke-width": 1.4, "stroke-linecap": "round", opacity: 0.35 }, to);
        if (c.mochilaVisible) {
          el("path", { d: "M-22,-163 Q-18,-140 -26,-108", fill: "none", stroke: TINTA, "stroke-width": 7.6, "stroke-linecap": "round" }, to);
          el("path", { d: "M-22,-163 Q-18,-140 -26,-108", fill: "none", stroke: c.mochila, "stroke-width": 4.2, "stroke-linecap": "round" }, to);
          el("path", { d: "M-24.6,-132 l6,1 l-0.8,5 l-6,-1 z", fill: c.colet, stroke: TINTA, "stroke-width": 1.6, "stroke-linejoin": "round" }, to);
        }
      }

      this.cabeza = el("g", {}, to);
      const ca = this.cabeza;
      el("path", { d: "M-6,-174 L-5,-160 L14,-160 L15,-174 Z", fill: c.pielSombra, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, ca);
      if (c.cola) {
        this.gCola = el("g", {}, ca);
        const dc = "M-30,-232 C-56,-226 -62,-196 -54,-172 C-50,-160 -40,-158 -38,-168 C-44,-186 -40,-210 -26,-222 Z";
        this._forma(this.gCola, dc, c.pelo, 3.4, {});
        el("path", { d: "M-46,-206 C-50,-194 -49,-182 -45,-172", fill: "none", stroke: c.peloLuz, "stroke-width": 2.4, "stroke-linecap": "round" }, this.gCola);
        el("path", { d: "M-38,-216 C-45,-206 -46,-192 -43,-181", fill: "none", stroke: c.peloLuz, "stroke-width": 1.5, "stroke-linecap": "round", opacity: 0.8 }, this.gCola);
        el("path", { d: "M-52,-190 C-54,-182 -52,-174 -48,-168", fill: "none", stroke: TINTA, "stroke-width": 1.3, "stroke-linecap": "round", opacity: 0.55 }, this.gCola);
      }
      const dcara = "M-26,-196 C-30,-238 6,-256 30,-240 C46,-230 50,-208 46,-190 C44,-172 34,-160 14,-158 C-6,-157 -22,-170 -26,-196 Z";
      this._forma(ca, dcara, c.piel, 3.6, {
        sombra: "M50,-210 C40,-222 26,-228 14,-226 C20,-218 18,-212 12,-208 C8,-218 -2,-224 -10,-222 C-14,-214 -16,-206 -18,-198 L-19,-190 C-16,-199 -13,-207 -9,-214 C-1,-216 8,-211 12,-200 C18,-205 21,-211 17,-219 C27,-220 40,-214 50,-202 Z M-36,-194 C-26,-192 -18,-182 -12,-171 C-8,-164 -3,-159 3,-156 L-40,-150 Z M2,-158 C16,-157 30,-161 40,-172 L50,-150 L0,-150 Z",
        colorSombra: c.pielMedia, grano: 0.28,
      });
      el("path", { d: "M-12,-202 C-17,-206 -24,-202 -24,-194 C-24,-187 -19,-184 -13,-187", fill: c.piel, stroke: TINTA, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, ca);
      el("path", { d: "M-17,-198 q3,4 0,8", fill: "none", stroke: c.pielSombra, "stroke-width": 2.2, "stroke-linecap": "round" }, ca);
      if (c.profe) {
        this._forma(ca, "M-26,-200 C-30,-236 0,-254 28,-244 C40,-238 44,-226 42,-220 C30,-230 8,-232 -6,-222 C-12,-214 -14,-204 -16,-198 Z", c.pelo, 3.4, {
          sombra: "M-30,-214 C-20,-226 -6,-230 8,-232 L8,-200 L-30,-196 Z", colorSombra: "#BDB6AB",
        });
        el("path", { d: "M-8,-240 C4,-246 18,-246 28,-242 M-18,-226 C-12,-232 -4,-236 4,-237", fill: "none", stroke: c.peloLuz, "stroke-width": 1.8, "stroke-linecap": "round" }, ca);
        el("path", { d: "M2,-176 q12,8 26,0 q-4,10 -14,10 q-10,0 -12,-10 z", fill: c.pelo, stroke: TINTA, "stroke-width": 2.4, "stroke-linejoin": "round" }, ca);
      } else {
        this._forma(ca, "M-27,-198 C-34,-240 4,-262 34,-244 C46,-236 52,-222 50,-210 C40,-222 26,-228 14,-226 C20,-218 18,-212 12,-208 C8,-218 -2,-224 -10,-222 C-14,-214 -16,-206 -18,-198 Z", c.pelo, 3.4, {});
        el("path", { d: "M2,-246 C16,-250 30,-246 38,-238", fill: "none", stroke: c.peloLuz, "stroke-width": 2.6, "stroke-linecap": "round" }, ca);
        el("path", { d: "M-16,-236 C-8,-248 6,-252 18,-251 M22,-236 C31,-235 40,-229 45,-221", fill: "none", stroke: c.peloLuz, "stroke-width": 1.5, "stroke-linecap": "round", opacity: 0.85 }, ca);
        el("path", { d: "M14,-226 C10,-232 3,-236 -5,-237 M-10,-222 C-16,-228 -20,-232 -23,-224", fill: "none", stroke: TINTA, "stroke-width": 1.3, "stroke-linecap": "round", opacity: 0.5 }, ca);
        el("path", { d: "M-31,-235 C-31,-241 -24,-243 -20,-239 C-16,-235 -17,-227 -23,-225 C-29,-224 -32,-229 -31,-235 Z", fill: c.colet, stroke: TINTA, "stroke-width": 2.6, "stroke-linejoin": "round" }, ca);
        el("path", { d: "M-27,-240 C-25,-235 -25,-230 -27,-226", fill: "none", stroke: TINTA, "stroke-width": 1.3, "stroke-linecap": "round", opacity: 0.6 }, ca);
      }
      this.cejas = el("path", { fill: "none", stroke: TINTA, "stroke-width": 3, "stroke-linecap": "round" }, ca);
      this.ojos = el("g", {}, ca);
      this.boca = el("path", { stroke: TINTA, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, ca);
      this.lengua = el("path", { d: "M22.6,-170.6 q5.4,-4.6 10.8,0 q-1.6,3.4 -5.4,3.4 q-3.8,0 -5.4,-3.4 z", fill: "#E8746A", opacity: 0 }, ca);
      el("ellipse", { cx: 4, cy: -181, rx: 8.5, ry: 5.2, fill: `url(#${this.uid}-rubor)` }, ca);
      el("ellipse", { cx: 40.5, cy: -182, rx: 5, ry: 4.4, fill: `url(#${this.uid}-rubor)` }, ca);
      el("path", { d: "M45,-196 q5,5 0,9", fill: "none", stroke: TINTA, "stroke-width": 2.6, "stroke-linecap": "round" }, ca);
      if (c.lentes) {
        el("circle", { cx: 18, cy: -198, r: 9, fill: "rgba(255,255,255,.25)", stroke: TINTA, "stroke-width": 2.6 }, ca);
        el("circle", { cx: 39, cy: -198, r: 7, fill: "rgba(255,255,255,.25)", stroke: TINTA, "stroke-width": 2.6 }, ca);
        el("path", { d: "M27,-199 l5,0 M9,-200 l-20,4", stroke: TINTA, "stroke-width": 2.4, "stroke-linecap": "round" }, ca);
        el("path", { d: "M12,-203 q3,-3 7,-3 M35,-202.6 q2,-2 5,-2", fill: "none", stroke: "#FFFFFF", "stroke-width": 1.6, "stroke-linecap": "round", opacity: 0.8 }, ca);
      }
      this.sudor = el("path", { d: "M-6,-232 q-6,9 0,12 q6,-3 0,-12 z", fill: "#8FD3FF", stroke: TINTA, "stroke-width": 2.2, opacity: 0 }, ca);
      this.gorro = el("g", { opacity: 0 }, ca);
      el("path", { d: "M-18,-236 L-18,-224 Q12,-212 40,-224 L40,-236", fill: "#2A2420", stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, this.gorro);
      el("path", { d: "M-42,-244 L11,-264 L64,-244 L11,-226 Z", fill: TINTA, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, this.gorro);
      el("path", { d: "M-30,-243 L11,-258 L50,-244", fill: "none", stroke: "#3A322B", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, this.gorro);
      el("path", { d: "M11,-245 Q-22,-242 -30,-218", fill: "none", stroke: "#FFC83D", "stroke-width": 3, "stroke-linecap": "round" }, this.gorro);
      el("path", { d: "M-34,-220 l8,0 l-2,14 l-4,0 z", fill: "#FFC83D", stroke: TINTA, "stroke-width": 1.4, "stroke-linejoin": "round" }, this.gorro);

      this.brazoD = this._limb(cu, c.polera, 13, { color: c.poleraSombra, ancho: 4.6, dx: -2.4, dy: 2.4 });
      this.punoD = el("path", { fill: "none", stroke: c.puno, "stroke-width": 13, "stroke-linecap": "butt" }, cu);
      this.objeto = el("g", {}, cu);
      this.manoD = this._mano(cu, c.piel);
      this.pulgar = el("path", { d: "", fill: c.piel, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, cu);

      const ob = this.objeto;
      this.obj = {};
      const g = (k) => (this.obj[k] = el("g", { opacity: 0 }, ob));
      const cel = g("celular");
      el("path", { d: "M-4,-26 h10 q4,0 4,4 v24 q0,4 -4,4 h-10 q-4,0 -4,-4 v-24 q0,-4 4,-4 z", fill: "#1E1E28", stroke: TINTA, "stroke-width": 2.8 }, cel);
      el("path", { d: "M-3,-22 h8 q2,0 2,2 v18 q0,2 -2,2 h-8 q-2,0 -2,-2 v-18 q0,-2 2,-2 z", fill: "#ECE5DD" }, cel);
      el("path", { d: "M-3,-17 h5.6 M0,-11 h5.4 M-3,-5 h4", stroke: "#25D366", "stroke-width": 2.6, "stroke-linecap": "round" }, cel);
      const pun = g("puntero");
      el("path", { d: "M0,0 L62,-34", stroke: TINTA, "stroke-width": 7, "stroke-linecap": "round" }, pun);
      el("path", { d: "M0,0 L62,-34", stroke: "#B9772C", "stroke-width": 3.4, "stroke-linecap": "round" }, pun);
      el("path", { d: "M4,-3 L58,-32", stroke: "#E0A35A", "stroke-width": 1.2, "stroke-linecap": "round" }, pun);
      el("circle", { cx: 63, cy: -35, r: 4.5, fill: "#FF5A4E", stroke: TINTA, "stroke-width": 2.6 }, pun);
      const car = g("carpeta");
      el("path", { d: "M-17,-34 h24 q3,0 3,3 v32 q0,3 -3,3 h-24 q-3,0 -3,-3 v-32 q0,-3 3,-3 z", fill: "#E9E2D2", stroke: TINTA, "stroke-width": 2.8 }, car);
      el("path", { d: "M-14,-24 h18 M-14,-17 h18 M-14,-10 h12", stroke: "#9C9486", "stroke-width": 2.2, "stroke-linecap": "round" }, car);
      el("path", { d: "M-8,-36 h10 v5 h-10 z", fill: "#B9B1A2", stroke: TINTA, "stroke-width": 1.6 }, car);
      const not = g("nota");
      this.notaCarta = el("g", {}, not);
      el("path", { d: "M-24,-86 h52 q6,0 6,6 v38 q0,6 -6,6 h-52 q-6,0 -6,-6 v-38 q0,-6 6,-6 z", fill: "#FFFFFF", stroke: TINTA, "stroke-width": 3.2 }, this.notaCarta);
      const t = el("text", { x: 2, y: -48, "text-anchor": "middle", "font-family": "Archivo, Arial Black, sans-serif", "font-weight": 900, "font-size": 30, fill: "#E8402F", style: "font-stretch:125%" }, this.notaCarta);
      t.textContent = "7,0";
      el("path", { d: "M2,-36 L2,-6", stroke: TINTA, "stroke-width": 5, "stroke-linecap": "round" }, not);
      const hoj = g("hoja");
      el("path", { d: "M-6,-40 L30,-44 L33,0 L-3,4 Z", fill: "#FFFFFF", stroke: TINTA, "stroke-width": 2.8, "stroke-linejoin": "round" }, hoj);
      el("path", { d: "M2,-32 l22,-2 M2,-25 l22,-2 M3,-18 l20,-2 M3,-11 l14,-1", stroke: "#B9B1A2", "stroke-width": 2.2, "stroke-linecap": "round" }, hoj);
      el("path", { d: "M18,-4 l4,4 l8,-10", fill: "none", stroke: "#1DB954", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, hoj);
      const par = (this.obj.paraguas = el("g", { opacity: 0 }, this.objetoT));
      el("path", { d: "M0,6 L0,-92", stroke: TINTA, "stroke-width": 4.4, "stroke-linecap": "round" }, par);
      el("path", { d: "M0,6 q0,8 -7,8 q-6,0 -6,-6", fill: "none", stroke: TINTA, "stroke-width": 4.4, "stroke-linecap": "round" }, par);
      this.lona = el("g", {}, par);
      const dl = "M-66,-84 Q-62,-138 0,-142 Q62,-138 66,-84 Q55,-94 44,-84 Q33,-94 22,-84 Q11,-94 0,-84 Q-11,-94 -22,-84 Q-33,-94 -44,-84 Q-55,-94 -66,-84 Z";
      this._forma(this.lona, dl, "#FF5A4E", 3.6, { sombra: "M-80,-98 C-40,-104 40,-104 80,-98 L80,-70 L-80,-70 Z", colorSombra: "#E34A3F", luz: "M-56,-100 C-54,-120 -40,-134 -14,-139 C-30,-128 -40,-116 -44,-100 Z", colorLuz: "#FF8A80" });
      el("path", { d: "M-22,-84 Q-24,-120 0,-142 Q24,-120 22,-84 Q11,-94 0,-84 Q-11,-94 -22,-84 Z", fill: "#FFF3D6", stroke: TINTA, "stroke-width": 2.8, "stroke-linejoin": "round" }, this.lona);
      el("path", { d: "M0,-142 L-44,-85 M0,-142 L44,-85", fill: "none", stroke: TINTA, "stroke-width": 1.6, "stroke-linecap": "round", opacity: 0.45 }, this.lona);
      el("path", { d: "M-4,-147 q4,-6 8,0 z", fill: TINTA, stroke: TINTA, "stroke-width": 2.6, "stroke-linejoin": "round" }, this.lona);
      const dip = g("diploma");
      el("path", { d: "M-24,-14 h48 q8,0 8,8 q0,8 -8,8 h-48 q-8,0 -8,-8 q0,-8 8,-8 z", fill: "#FFF3D6", stroke: TINTA, "stroke-width": 2.8 }, dip);
      el("ellipse", { cx: 32, cy: -6, rx: 5, ry: 8, fill: "#E9DDBF", stroke: TINTA, "stroke-width": 2.4 }, dip);
      el("path", { d: "M-6,-15 h10 v18 h-10 z", fill: "#FF5A4E", stroke: TINTA, "stroke-width": 2.2 }, dip);
      el("path", { d: "M-1,3 l-4,10 l4,-3 l4,3 l-4,-10", fill: "#FF5A4E", stroke: TINTA, "stroke-width": 1.8, "stroke-linejoin": "round" }, dip);
    }

    _ojos(tipo, parpadea) {
      const g = this.ojos;
      while (g.firstChild) g.removeChild(g.firstChild);
      const ojo = (x, y, rx, ry) => el("ellipse", { cx: x, cy: y, rx, ry, fill: TINTA }, g);
      const brillo = (x, y) => el("circle", { cx: x, cy: y, r: 1.4, fill: "#fff" }, g);
      const pestanas = (y) => { if (!this.c.profe) el("path", { d: `M21.6,${y} l3,-2.6 M41.6,${y + 0.4} l2.6,-2.2`, fill: "none", stroke: TINTA, "stroke-width": 2, "stroke-linecap": "round" }, g); };
      if (parpadea && tipo !== "feliz") {
        el("path", { d: "M13,-197 q5,2 10,0 M35,-197 q4,2 7,0", fill: "none", stroke: TINTA, "stroke-width": 3, "stroke-linecap": "round" }, g);
        return;
      }
      if (tipo === "feliz") {
        el("path", { d: "M12,-196 q6,-8 12,0 M34,-196 q4,-7 9,0", fill: "none", stroke: TINTA, "stroke-width": 3.2, "stroke-linecap": "round" }, g);
      } else if (tipo === "sorpresa") {
        ojo(18, -198, 4.6, 6.2); ojo(39, -198, 3.6, 5.6); brillo(19.5, -200.5); brillo(40, -200.5); pestanas(-203);
      } else if (tipo === "abajo") {
        ojo(19, -193, 3.6, 4.2); ojo(40, -193, 3, 3.8);
        el("path", { d: "M14.6,-196.6 q4.6,-2 9,0 M36.6,-196.4 q3.6,-1.6 7,0", fill: "none", stroke: TINTA, "stroke-width": 1.8, "stroke-linecap": "round" }, g);
      } else if (tipo === "preocupado") {
        ojo(18, -196, 3.8, 5); ojo(39, -196, 3.1, 4.6); brillo(19.2, -198); brillo(40, -198); pestanas(-200);
      } else {
        ojo(18, -197, 3.8, 5.2); ojo(39, -197, 3.1, 4.8); brillo(19.3, -199.2); brillo(40, -199.2); pestanas(-201);
      }
    }

    _expresion(p) {
      const cejas = {
        normal: "M12,-210 q6,-4 12,-1 M34,-209 q4,-3 9,0",
        feliz: "M12,-212 q6,-5 12,-2 M34,-211 q4,-4 9,-1",
        sorpresa: "M12,-215 q6,-5 12,-2 M34,-214 q4,-4 9,-1",
        abajo: "M12,-207 q6,-2 12,0 M34,-206 q4,-2 9,0",
        preocupado: "M12,-206 q6,-6 12,-8 M34,-214 q4,2 9,6",
      };
      const kc = p.ojos || "normal";
      if (kc !== this._cejasClave) { this.cejas.setAttribute("d", cejas[kc] || cejas.normal); this._cejasClave = kc; }
      const bocas = {
        sonrisa: { d: "M20,-178 q8,7 16,0", f: "none" },
        abierta: { d: "M18,-180 q10,0 20,0 q-2,13 -10,13 q-8,0 -10,-13 z", f: "#8A2B2B" },
        ondulada: { d: "M18,-175 q4,-4 7,0 q4,4 7,0 q3,-4 6,0", f: "none" },
        plana: { d: "M22,-176 h12", f: "none" },
        o: { d: "M26,-180 q5,0 5,6 q0,6 -5,6 q-5,0 -5,-6 q0,-6 5,-6 z", f: "#8A2B2B" },
      };
      const kb = p.boca || "sonrisa";
      if (kb !== this._bocaClave) {
        const b = bocas[kb] || bocas.sonrisa;
        this.boca.setAttribute("d", b.d); this.boca.setAttribute("fill", b.f);
        this.lengua.setAttribute("opacity", kb === "abierta" ? 1 : 0);
        this._bocaClave = kb;
      }
      const clave = kc + (this.parpadeo > 0.5 ? "-p" : "");
      if (clave !== this._ojosClave) { this._ojos(kc, this.parpadeo > 0.5); this._ojosClave = clave; }
      this.sudor.setAttribute("opacity", p.sudor ? Math.min(1, p.sudor).toFixed(2) : 0);
    }

    _zapato(g, x, y, ang) {
      const c = this.c;
      if (!g._p) {
        g._p = el("path", { d: "M-9,-6 Q-10,-13 -2,-13 L6,-13 Q10,-8 16,-7 Q24,-6 24,1 Q24,5 18,5 L-6,5 Q-11,5 -9,-6 Z", fill: c.zapato, stroke: TINTA, "stroke-width": 3.2, "stroke-linejoin": "round" }, g);
        el("path", { d: "M12,-7.4 Q13.6,-1.6 23.4,-1.2", fill: "none", stroke: TINTA, "stroke-width": 1.3, "stroke-linecap": "round", opacity: 0.5 }, g);
        el("path", { d: "M0.6,-12.4 l3.6,3.4 M4.8,-12.4 l3.4,3.2", fill: "none", stroke: TINTA, "stroke-width": 1.5, "stroke-linecap": "round", opacity: c.profe ? 0.4 : 0.75 }, g);
        g._s = el("path", { d: "M-9,2 L23,2", stroke: c.suela, "stroke-width": 3.2, "stroke-linecap": "round" }, g);
      }
      g.setAttribute("transform", `translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${ang.toFixed(2)})`);
    }

    poner(pose) { this.pose = Object.assign({}, this.pose, pose); }

    render() {
      const p = this.pose;
      const torRad = (p.tor || 0) * Math.PI / 180;
      const pelX = p.pelX, pelY = p.pelY + (p.bob || 0);
      const rot = (x, y) => {
        const dx = x, dy = y - MED.cadera;
        return [pelX + dx * Math.cos(torRad) - dy * Math.sin(torRad), pelY + dx * Math.sin(torRad) + dy * Math.cos(torRad)];
      };
      this.torso.setAttribute("transform", `translate(${pelX.toFixed(2)},${(pelY - MED.cadera).toFixed(2)}) rotate(${(p.tor || 0).toFixed(2)},0,${MED.cadera})`);
      this.cabeza.setAttribute("transform", `rotate(${(p.cab || 0).toFixed(2)},4,-168)`);
      if (this.gCola) this.gCola.setAttribute("transform", `rotate(${((p.cola || 0) + (p.colaVaiven || 0)).toFixed(2)},-28,-226)`);

      const trazo = (limb, d) => { for (const n of limb.capas) n.setAttribute("d", d); };
      const caderaD = [pelX + 6, pelY - 2], caderaT = [pelX - 8, pelY - 2];
      const ikPierna = (cad, x, y, limb, zap) => {
        const r = ik(cad[0], cad[1], x, y - 6, MED.muslo, MED.canilla, -1);
        trazo(limb, `M${cad[0].toFixed(2)},${cad[1].toFixed(2)} L${r.jx.toFixed(2)},${r.jy.toFixed(2)} L${r.tx.toFixed(2)},${r.ty.toFixed(2)}`);
        const ang = Math.atan2(r.ty - r.jy, r.tx - r.jx) * 180 / Math.PI - 90;
        this._zapato(zap, r.tx, r.ty + 1, Math.max(-40, Math.min(40, ang * 0.6 + (p.punta || 0))));
      };
      ikPierna(caderaT, p.pTx, p.pTy, this.piernaT, this.zapatoT);
      ikPierna(caderaD, p.pDx, p.pDy, this.piernaD, this.zapatoD);

      const hombroD = rot(27, -153), hombroT = rot(-25, -153);
      const ikBrazo = (hom, mx, my, limb, mano, signo) => {
        const r = ik(hom[0], hom[1], hom[0] + mx, hom[1] + my, MED.brazo, MED.antebrazo, signo);
        trazo(limb, `M${hom[0].toFixed(2)},${hom[1].toFixed(2)} L${r.jx.toFixed(2)},${r.jy.toFixed(2)} L${r.tx.toFixed(2)},${r.ty.toFixed(2)}`);
        const ang = Math.atan2(r.ty - r.jy, r.tx - r.jx) * 180 / Math.PI;
        mano.g.setAttribute("transform", `translate(${r.tx.toFixed(2)},${r.ty.toFixed(2)}) rotate(${ang.toFixed(2)}) translate(-3,0)`);
        return r;
      };
      // el signo del codo no se interpola: en una mezcla de poses vale el lado que ya tiene
      const sD = p.signoD ? (p.signoD > 0 ? 1 : -1) : (p.mDy < -20 ? -1 : 1);
      const sT = p.signoT ? (p.signoT > 0 ? 1 : -1) : (p.mTy < -20 ? -1 : 1);
      const rT = ikBrazo(hombroT, p.mTx, p.mTy, this.brazoT, this.manoT, sT);
      const rD = ikBrazo(hombroD, p.mDx, p.mDy, this.brazoD, this.manoD, sD);
      const ux = rD.tx - rD.jx, uy = rD.ty - rD.jy, ul = Math.hypot(ux, uy) || 1;
      this.punoD.setAttribute("d", `M${(rD.tx - ux / ul * 9).toFixed(2)},${(rD.ty - uy / ul * 9).toFixed(2)} L${(rD.tx - ux / ul * 4).toFixed(2)},${(rD.ty - uy / ul * 4).toFixed(2)}`);

      const ob = p.objeto || "";
      for (const k in this.obj) this.obj[k].setAttribute("opacity", k === ob ? 1 : 0);
      const angMano = Math.atan2(uy, ux) * 180 / Math.PI;
      if (ob === "puntero") this.objeto.setAttribute("transform", `translate(${rD.tx.toFixed(2)},${rD.ty.toFixed(2)}) rotate(${(angMano + 30).toFixed(2)})`);
      else if (ob === "diploma") this.objeto.setAttribute("transform", `translate(${rD.tx.toFixed(2)},${rD.ty.toFixed(2)}) rotate(-62)`);
      else this.objeto.setAttribute("transform", `translate(${rD.tx.toFixed(2)},${rD.ty.toFixed(2)})`);
      this.objetoT.setAttribute("transform", `translate(${rT.tx.toFixed(2)},${rT.ty.toFixed(2)})`);
      this.notaCarta.setAttribute("transform", this.mira < 0 ? "translate(4,0) scale(-1,1)" : "");
      if (ob === "paraguas") this.lona.setAttribute("transform", `scale(${Math.max(0.08, Math.min(1, p.paraguas)).toFixed(3)},${(0.6 + 0.4 * Math.min(1, p.paraguas)).toFixed(3)})`);
      this.pulgar.setAttribute("d", ob === "pulgar" ? `M${(rD.tx - 4).toFixed(2)},${(rD.ty - 4).toFixed(2)} q-2,-16 5,-17 q6,0 4,8 l-2,9 z` : "");
      this.manoD.pulgar.setAttribute("opacity", ob === "pulgar" ? 0 : 1);
      this.gorro.setAttribute("opacity", p.gorro ? Math.min(1, p.gorro).toFixed(2) : 0);
      const arriba = (p.manoTArriba || 0) > 0.5;
      if (arriba !== this._manoArriba) {
        if (arriba) this.cuerpo.appendChild(this.manoT.g); else this.cuerpo.insertBefore(this.manoT.g, this.objetoT.nextSibling);
        this._manoArriba = arriba;
      }

      this._expresion(p);
      const alto = Math.max(0, -95 - pelY);
      const k = Math.max(0.35, 1 - alto / 160);
      this.sombra.setAttribute("rx", (40 * k).toFixed(2));
      this.sombra.setAttribute("opacity", ((p.sinSombra ? 0 : 0.18) * k).toFixed(3));
      this.cuerpo.setAttribute("transform", `scale(${this.mira},1)`);
      this.sombra.setAttribute("cx", (2 * this.mira).toFixed(2));
    }

    /* Ciclo de caminata: fase 0..1 por cada dos pasos (60 unidades de avance). */
    caminar(fase) {
      const paso = (f) => {
        f = ((f % 1) + 1) % 1;
        if (f < 0.5) { const t = f / 0.5; return { x: lerp(16, -16, t), y: 0 }; }
        const t = (f - 0.5) / 0.5, e = t * t * (3 - 2 * t);
        return { x: lerp(-16, 16, e), y: -Math.sin(Math.PI * t) * 13 };
      };
      const a = paso(fase), b = paso(fase + 0.5);
      return Object.assign({}, POSES.parado, {
        pDx: a.x + 2, pDy: a.y, pTx: b.x - 2, pTy: b.y,
        mDx: 8 - a.x * 1.1, mDy: 61, mTx: -2 - b.x * 1.1, mTy: 61,
        bob: Math.cos(fase * Math.PI * 4) * 2.4, tor: 3,
        colaVaiven: Math.sin(fase * Math.PI * 4) * 6, punta: a.y < -2 ? -12 : 0,
      });
    }
  }

  Personaje.POSES = POSES;
  Personaje.VB = VB;
  Personaje.mezclar = mezclar;
  Personaje.asegurarGrano = asegurarGrano;
  global.Personaje = Personaje;
})(window);
