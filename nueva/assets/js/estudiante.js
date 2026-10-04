/* Personaje ilustrado con esqueleto (cinematica inversa de 2 huesos).
   Coordenadas locales: origen en el suelo entre los pies, y negativa hacia arriba, mirando a la derecha. */
(function (global) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const TINTA = "#16120E";
  const VB = { x: -160, y: -370, w: 320, h: 395 };

  const PIELES = {
    estudiante: {
      piel: "#EDB08A", pielSombra: "#D38E66", mejilla: "#F08F80",
      pelo: "#2B1A12", peloLuz: "#4A2E20",
      polera: "#FFC83D", poleraSombra: "#EBA51F", puno: "#F2B02A",
      pantalon: "#26305E", pantalonSombra: "#1B2347",
      zapato: "#FFFFFF", suela: "#FF5A4E",
      mochila: "#FF5A4E", mochilaSombra: "#D7443A",
      cola: true, lentes: false, mochilaVisible: true, profe: false,
    },
    profesor: {
      piel: "#C98B63", pielSombra: "#AE7350", mejilla: "#D9826E",
      pelo: "#D9D4CC", peloLuz: "#F1EDE6",
      polera: "#3B4A7A", poleraSombra: "#2C385F", puno: "#334172",
      pantalon: "#3A3A44", pantalonSombra: "#2A2A32",
      zapato: "#5A3A28", suela: "#3A2518",
      mochila: "#000", mochilaSombra: "#000",
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
    saludo: P({ tor: -2, cab: -4, mDx: 36, mDy: -46, mTx: -2, mTy: 62, ojos: "feliz", boca: "abierta", objeto: "" }),
    sentadoEstres: P({ pelX: -14, pelY: -58, tor: 8, cab: 14, mDx: 4, mDy: -24, mTx: 44, mTy: 14, signoD: 1, pDx: 30, pTx: 18, ojos: "preocupado", boca: "ondulada", objeto: "", sudor: 1 }),
    sentadoTeclea: P({ pelX: -14, pelY: -58, tor: 10, cab: 12, mDx: 52, mDy: 10, mTx: 44, mTy: 14, pDx: 30, pTx: 18, ojos: "abajo", boca: "plana", objeto: "" }),
    celular: P({ tor: -3, cab: 8, mDx: 14, mDy: 6, mTx: 10, mTy: 16, ojos: "abajo", boca: "sonrisa", objeto: "celular" }),
    pulgar: P({ tor: -2, cab: -2, mDx: 22, mDy: 0, mTx: -2, mTy: 62, ojos: "feliz", boca: "abierta", objeto: "pulgar" }),
    lee: P({ tor: -2, cab: 10, mDx: 16, mDy: 4, mTx: 30, mTy: 8, ojos: "abajo", boca: "sonrisa", objeto: "hoja" }),
    presenta: P({ tor: -4, cab: -6, mDx: 56, mDy: -30, mTx: 14, mTy: 30, pDx: 16, pTx: -10, ojos: "normal", boca: "abierta", objeto: "puntero" }),
    salto: P({ pelY: -150, tor: -4, cab: -8, mDx: 30, mDy: -58, mTx: -26, mTy: -56, pDx: 22, pDy: -46, pTx: -14, pTy: -40, ojos: "feliz", boca: "abierta", cola: 18, objeto: "" }),
    flota: P({ pelY: -100, tor: 3, cab: -6, mDx: 34, mDy: 16, mTx: 6, mTy: -62, signoT: -1, pDx: 12, pDy: -6, pTx: -9, pTy: 4, ojos: "feliz", boca: "abierta", cola: 60, objeto: "paraguas", paraguas: 1 }),
    celebra: P({ tor: -3, cab: -8, mDx: 34, mDy: -48, mTx: -26, mTy: -54, ojos: "feliz", boca: "abierta", objeto: "diploma", gorro: 1 }),
    profeSentado: P({ pelX: -14, pelY: -58, tor: 2, mDx: 30, mDy: 28, mTx: 22, mTy: 32, pDx: 30, pTx: 18, ojos: "normal", boca: "plana", objeto: "carpeta" }),
    profeNota: P({ tor: -2, cab: -4, mDx: 24, mDy: -56, mTx: 2, mTy: 40, ojos: "feliz", boca: "sonrisa", objeto: "nota" }),
  };

  class Personaje {
    constructor(opciones) {
      const o = Object.assign({ piel: "estudiante" }, opciones || {});
      this.c = PIELES[o.piel];
      this.pose = Object.assign({}, POSES.parado);
      this.mira = 1;
      this.parpadeo = 0;
      this.svg = el("svg", { viewBox: `${VB.x} ${VB.y} ${VB.w} ${VB.h}`, class: "personaje", "aria-hidden": "true", focusable: "false" });
      this.raiz = el("g", {}, this.svg);
      this.sombra = el("ellipse", { cx: 2, cy: 2, rx: 40, ry: 6, fill: TINTA, opacity: 0.18 }, this.raiz);
      this.cuerpo = el("g", {}, this.raiz);
      this._construir();
      this.render();
    }

    _limb(parent, color, ancho) {
      const g = el("g", {}, parent);
      const borde = el("path", { fill: "none", stroke: TINTA, "stroke-width": ancho + 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      const relleno = el("path", { fill: "none", stroke: color, "stroke-width": ancho, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      return { g, borde, relleno };
    }

    _construir() {
      const c = this.c, cu = this.cuerpo;
      this.piernaT = this._limb(cu, c.pantalonSombra, 17);
      this.zapatoT = el("g", {}, cu);
      this.brazoT = this._limb(cu, c.poleraSombra, 13);
      this.objetoT = el("g", {}, cu);
      this.manoT = el("circle", { r: 7.6, fill: c.pielSombra, stroke: TINTA, "stroke-width": 3.4 }, cu);
      this.piernaD = this._limb(cu, c.pantalon, 17);
      this.zapatoD = el("g", {}, cu);

      this.torso = el("g", {}, cu);
      const to = this.torso;
      if (c.mochilaVisible) {
        el("path", { d: "M-44,-150 q-6,2 -7,14 l-3,40 q0,10 10,11 l20,1 l4,-66 z", fill: c.mochila, stroke: TINTA, "stroke-width": 3.4, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-50,-118 l18,1", stroke: c.mochilaSombra, "stroke-width": 4, "stroke-linecap": "round" }, to);
        el("path", { d: "M-47,-96 q8,4 14,2", fill: "none", stroke: c.mochilaSombra, "stroke-width": 3, "stroke-linecap": "round" }, to);
      }
      if (c.profe) {
        el("path", { d: "M-27,-166 C-34,-160 -36,-130 -34,-96 Q-33,-88 -24,-88 L30,-88 Q38,-88 38,-96 C39,-128 36,-160 28,-166 Q2,-174 -27,-166 Z", fill: c.polera, stroke: TINTA, "stroke-width": 3.6, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-6,-168 L6,-140 L16,-168", fill: "#F4EFE6", stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, to);
        el("path", { d: "M6,-150 l-4,6 l4,26 l4,-26 z", fill: "#E8533F", stroke: TINTA, "stroke-width": 2.4, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-6,-168 L4,-126 M16,-168 L8,-126", stroke: c.poleraSombra, "stroke-width": 3, fill: "none" }, to);
      } else {
        el("path", { d: "M-28,-164 C-36,-158 -38,-128 -36,-100 Q-36,-90 -26,-89 L32,-89 Q40,-90 40,-100 C41,-128 38,-158 30,-164 Q2,-176 -28,-164 Z", fill: c.polera, stroke: TINTA, "stroke-width": 3.6, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-34,-104 Q2,-98 39,-104 L39,-98 Q39,-90 31,-90 L-27,-90 Q-35,-90 -35,-98 Z", fill: c.puno }, to);
        el("path", { d: "M-8,-124 Q6,-121 22,-124 L24,-104 L-10,-104 Z", fill: c.poleraSombra, stroke: TINTA, "stroke-width": 2.6, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-24,-166 Q-4,-150 22,-166 Q4,-158 -24,-166 Z", fill: c.poleraSombra, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, to);
        el("path", { d: "M-2,-158 l-3,16 M10,-158 l3,15", stroke: TINTA, "stroke-width": 2.4, "stroke-linecap": "round" }, to);
        el("circle", { cx: -5, cy: -141, r: 2.2, fill: TINTA }, to);
        el("circle", { cx: 13, cy: -142, r: 2.2, fill: TINTA }, to);
        if (c.mochilaVisible) el("path", { d: "M-22,-163 Q-18,-140 -26,-108", fill: "none", stroke: c.mochilaSombra, "stroke-width": 5, "stroke-linecap": "round" }, to);
      }

      this.cabeza = el("g", {}, to);
      const ca = this.cabeza;
      el("path", { d: "M-6,-174 L-5,-160 L14,-160 L15,-174 Z", fill: c.pielSombra, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, ca);
      if (c.cola) {
        this.gCola = el("g", {}, ca);
        el("path", { d: "M-30,-232 C-56,-226 -62,-196 -54,-172 C-50,-160 -40,-158 -38,-168 C-44,-186 -40,-210 -26,-222 Z", fill: c.pelo, stroke: TINTA, "stroke-width": 3.4, "stroke-linejoin": "round" }, this.gCola);
        el("path", { d: "M-46,-206 C-50,-194 -49,-182 -45,-172", fill: "none", stroke: c.peloLuz, "stroke-width": 2.6, "stroke-linecap": "round" }, this.gCola);
      }
      el("path", { d: "M-26,-196 C-30,-238 6,-256 30,-240 C46,-230 50,-208 46,-190 C44,-172 34,-160 14,-158 C-6,-157 -22,-170 -26,-196 Z", fill: c.piel, stroke: TINTA, "stroke-width": 3.6, "stroke-linejoin": "round" }, ca);
      el("ellipse", { cx: -16, cy: -194, rx: 7, ry: 9, fill: c.piel, stroke: TINTA, "stroke-width": 3.2 }, ca);
      el("path", { d: "M-17,-198 q3,4 0,8", fill: "none", stroke: c.pielSombra, "stroke-width": 2.4, "stroke-linecap": "round" }, ca);
      if (c.profe) {
        el("path", { d: "M-26,-200 C-30,-236 0,-254 28,-244 C40,-238 44,-226 42,-220 C30,-230 8,-232 -6,-222 C-12,-214 -14,-204 -16,-198 Z", fill: c.pelo, stroke: TINTA, "stroke-width": 3.4, "stroke-linejoin": "round" }, ca);
        el("path", { d: "M2,-176 q12,8 26,0 q-4,10 -14,10 q-10,0 -12,-10 z", fill: c.pelo, stroke: TINTA, "stroke-width": 2.6, "stroke-linejoin": "round" }, ca);
      } else {
        el("path", { d: "M-27,-198 C-34,-240 4,-262 34,-244 C46,-236 52,-222 50,-210 C40,-222 26,-228 14,-226 C20,-218 18,-212 12,-208 C8,-218 -2,-224 -10,-222 C-14,-214 -16,-206 -18,-198 Z", fill: c.pelo, stroke: TINTA, "stroke-width": 3.4, "stroke-linejoin": "round" }, ca);
        el("path", { d: "M2,-246 C16,-250 30,-246 38,-238", fill: "none", stroke: c.peloLuz, "stroke-width": 3, "stroke-linecap": "round" }, ca);
        el("circle", { cx: -24, cy: -232, r: 7, fill: c.pelo, stroke: TINTA, "stroke-width": 3 }, ca);
      }
      this.cejas = el("path", { fill: "none", stroke: TINTA, "stroke-width": 3, "stroke-linecap": "round" }, ca);
      this.ojos = el("g", {}, ca);
      this.boca = el("path", { stroke: TINTA, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, ca);
      el("ellipse", { cx: 4, cy: -182, rx: 6, ry: 3.6, fill: c.mejilla, opacity: 0.75 }, ca);
      el("ellipse", { cx: 40, cy: -183, rx: 3.6, ry: 3.2, fill: c.mejilla, opacity: 0.75 }, ca);
      el("path", { d: "M45,-196 q5,5 0,9", fill: "none", stroke: TINTA, "stroke-width": 2.8, "stroke-linecap": "round" }, ca);
      if (c.lentes) {
        el("circle", { cx: 18, cy: -198, r: 9, fill: "rgba(255,255,255,.25)", stroke: TINTA, "stroke-width": 2.8 }, ca);
        el("circle", { cx: 39, cy: -198, r: 7, fill: "rgba(255,255,255,.25)", stroke: TINTA, "stroke-width": 2.8 }, ca);
        el("path", { d: "M27,-199 l5,0 M9,-200 l-20,4", stroke: TINTA, "stroke-width": 2.6, "stroke-linecap": "round" }, ca);
      }
      this.sudor = el("path", { d: "M-6,-232 q-6,9 0,12 q6,-3 0,-12 z", fill: "#8FD3FF", stroke: TINTA, "stroke-width": 2.4, opacity: 0 }, ca);
      this.gorro = el("g", { opacity: 0 }, ca);
      el("path", { d: "M-18,-236 L-18,-224 Q12,-212 40,-224 L40,-236", fill: "#2A2420", stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, this.gorro);
      el("path", { d: "M-42,-244 L11,-264 L64,-244 L11,-226 Z", fill: TINTA, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, this.gorro);
      el("path", { d: "M11,-245 Q-22,-242 -30,-218", fill: "none", stroke: "#FFC83D", "stroke-width": 3, "stroke-linecap": "round" }, this.gorro);
      el("path", { d: "M-34,-220 l8,0 l-2,14 l-4,0 z", fill: "#FFC83D" }, this.gorro);

      this.brazoD = this._limb(cu, c.polera, 13);
      this.punoD = el("path", { fill: "none", stroke: c.puno, "stroke-width": 13, "stroke-linecap": "butt" }, cu);
      this.objeto = el("g", {}, cu);
      this.manoD = el("circle", { r: 7.8, fill: c.piel, stroke: TINTA, "stroke-width": 3.4 }, cu);
      this.pulgar = el("path", { d: "", fill: c.piel, stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, cu);

      const ob = this.objeto;
      this.obj = {};
      const g = (k) => (this.obj[k] = el("g", { opacity: 0 }, ob));
      const cel = g("celular");
      el("rect", { x: -8, y: -26, width: 18, height: 32, rx: 4, fill: "#1E1E28", stroke: TINTA, "stroke-width": 3 }, cel);
      el("rect", { x: -5, y: -22, width: 12, height: 22, rx: 2, fill: "#25D366" }, cel);
      el("path", { d: "M-2,-14 h6 M-2,-9 h4", stroke: "#fff", "stroke-width": 2, "stroke-linecap": "round" }, cel);
      const pun = g("puntero");
      el("path", { d: "M0,0 L62,-34", stroke: TINTA, "stroke-width": 7, "stroke-linecap": "round" }, pun);
      el("path", { d: "M0,0 L62,-34", stroke: "#B9772C", "stroke-width": 3.4, "stroke-linecap": "round" }, pun);
      el("circle", { cx: 63, cy: -35, r: 4.5, fill: "#FF5A4E", stroke: TINTA, "stroke-width": 2.6 }, pun);
      const car = g("carpeta");
      el("rect", { x: -20, y: -34, width: 30, height: 38, rx: 3, fill: "#E9E2D2", stroke: TINTA, "stroke-width": 3 }, car);
      el("path", { d: "M-14,-24 h18 M-14,-17 h18 M-14,-10 h12", stroke: "#9C9486", "stroke-width": 2.4, "stroke-linecap": "round" }, car);
      const not = g("nota");
      this.notaCarta = el("g", {}, not);
      el("rect", { x: -30, y: -86, width: 64, height: 50, rx: 6, fill: "#FFFFFF", stroke: TINTA, "stroke-width": 3.4 }, this.notaCarta);
      const t = el("text", { x: 2, y: -48, "text-anchor": "middle", "font-family": "Archivo, Arial Black, sans-serif", "font-weight": 900, "font-size": 30, fill: "#E8402F", style: "font-stretch:125%" }, this.notaCarta);
      t.textContent = "7,0";
      el("path", { d: "M2,-36 L2,-6", stroke: TINTA, "stroke-width": 5, "stroke-linecap": "round" }, not);
      const hoj = g("hoja");
      el("path", { d: "M-6,-40 L30,-44 L33,0 L-3,4 Z", fill: "#FFFFFF", stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, hoj);
      el("path", { d: "M2,-32 l22,-2 M2,-25 l22,-2 M3,-18 l20,-2 M3,-11 l14,-1", stroke: "#B9B1A2", "stroke-width": 2.4, "stroke-linecap": "round" }, hoj);
      el("path", { d: "M18,-4 l4,4 l8,-10", fill: "none", stroke: "#1DB954", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, hoj);
      const par = (this.obj.paraguas = el("g", { opacity: 0 }, this.objetoT));
      el("path", { d: "M0,6 L0,-92", stroke: TINTA, "stroke-width": 4.4, "stroke-linecap": "round" }, par);
      el("path", { d: "M0,6 q0,8 -7,8 q-6,0 -6,-6", fill: "none", stroke: TINTA, "stroke-width": 4.4, "stroke-linecap": "round" }, par);
      this.lona = el("g", {}, par);
      el("path", { d: "M-66,-84 Q-62,-138 0,-142 Q62,-138 66,-84 Q55,-94 44,-84 Q33,-94 22,-84 Q11,-94 0,-84 Q-11,-94 -22,-84 Q-33,-94 -44,-84 Q-55,-94 -66,-84 Z", fill: "#FF5A4E", stroke: TINTA, "stroke-width": 3.6, "stroke-linejoin": "round" }, this.lona);
      el("path", { d: "M-22,-84 Q-24,-120 0,-142 Q24,-120 22,-84 Q11,-94 0,-84 Q-11,-94 -22,-84 Z", fill: "#FFF3D6", stroke: TINTA, "stroke-width": 3, "stroke-linejoin": "round" }, this.lona);
      el("circle", { cx: 0, cy: -145, r: 4, fill: TINTA }, this.lona);
      const dip = g("diploma");
      el("rect", { x: -32, y: -14, width: 64, height: 16, rx: 8, fill: "#FFF3D6", stroke: TINTA, "stroke-width": 3 }, dip);
      el("ellipse", { cx: 32, cy: -6, rx: 5, ry: 8, fill: "#E9DDBF", stroke: TINTA, "stroke-width": 2.6 }, dip);
      el("rect", { x: -6, y: -15, width: 10, height: 18, fill: "#FF5A4E", stroke: TINTA, "stroke-width": 2.4 }, dip);
    }

    _ojos(tipo, parpadea) {
      const g = this.ojos;
      while (g.firstChild) g.removeChild(g.firstChild);
      const ojo = (x, y, rx, ry) => el("ellipse", { cx: x, cy: y, rx, ry, fill: TINTA }, g);
      const brillo = (x, y) => el("circle", { cx: x, cy: y, r: 1.3, fill: "#fff" }, g);
      if (parpadea && tipo !== "feliz") {
        el("path", { d: "M13,-197 q5,2 10,0 M35,-197 q4,2 7,0", fill: "none", stroke: TINTA, "stroke-width": 3, "stroke-linecap": "round" }, g);
        return;
      }
      if (tipo === "feliz") {
        el("path", { d: "M12,-196 q6,-8 12,0 M34,-196 q4,-7 9,0", fill: "none", stroke: TINTA, "stroke-width": 3.2, "stroke-linecap": "round" }, g);
      } else if (tipo === "sorpresa") {
        ojo(18, -198, 4.6, 6.2); ojo(39, -198, 3.6, 5.6); brillo(19.5, -200.5); brillo(40, -200.5);
      } else if (tipo === "abajo") {
        ojo(19, -193, 3.6, 4.2); ojo(40, -193, 3, 3.8);
      } else if (tipo === "preocupado") {
        ojo(18, -196, 3.8, 5); ojo(39, -196, 3.1, 4.6); brillo(19.2, -198); brillo(40, -198);
      } else {
        ojo(18, -197, 3.8, 5.2); ojo(39, -197, 3.1, 4.8); brillo(19.3, -199.2); brillo(40, -199.2);
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
      if (kb !== this._bocaClave) { const b = bocas[kb] || bocas.sonrisa; this.boca.setAttribute("d", b.d); this.boca.setAttribute("fill", b.f); this._bocaClave = kb; }
      const clave = kc + (this.parpadeo > 0.5 ? "-p" : "");
      if (clave !== this._ojosClave) { this._ojos(kc, this.parpadeo > 0.5); this._ojosClave = clave; }
      this.sudor.setAttribute("opacity", p.sudor ? Math.min(1, p.sudor).toFixed(2) : 0);
    }

    _zapato(g, x, y, ang) {
      const c = this.c;
      if (!g._p) {
        g._p = el("path", { d: "M-9,-6 Q-10,-13 -2,-13 L6,-13 Q10,-8 16,-7 Q24,-6 24,1 Q24,5 18,5 L-6,5 Q-11,5 -9,-6 Z", fill: c.zapato, stroke: TINTA, "stroke-width": 3.2, "stroke-linejoin": "round" }, g);
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

      const caderaD = [pelX + 6, pelY - 2], caderaT = [pelX - 8, pelY - 2];
      const ikPierna = (cad, x, y, limb, zap) => {
        const r = ik(cad[0], cad[1], x, y - 6, MED.muslo, MED.canilla, -1);
        const d = `M${cad[0].toFixed(2)},${cad[1].toFixed(2)} L${r.jx.toFixed(2)},${r.jy.toFixed(2)} L${r.tx.toFixed(2)},${r.ty.toFixed(2)}`;
        limb.borde.setAttribute("d", d); limb.relleno.setAttribute("d", d);
        const ang = Math.atan2(r.ty - r.jy, r.tx - r.jx) * 180 / Math.PI - 90;
        this._zapato(zap, r.tx, r.ty + 1, Math.max(-40, Math.min(40, ang * 0.6 + (p.punta || 0))));
      };
      ikPierna(caderaT, p.pTx, p.pTy, this.piernaT, this.zapatoT);
      ikPierna(caderaD, p.pDx, p.pDy, this.piernaD, this.zapatoD);

      const hombroD = rot(27, -153), hombroT = rot(-25, -153);
      const ikBrazo = (hom, mx, my, limb, mano, signo) => {
        const r = ik(hom[0], hom[1], hom[0] + mx, hom[1] + my, MED.brazo, MED.antebrazo, signo);
        const d = `M${hom[0].toFixed(2)},${hom[1].toFixed(2)} L${r.jx.toFixed(2)},${r.jy.toFixed(2)} L${r.tx.toFixed(2)},${r.ty.toFixed(2)}`;
        limb.borde.setAttribute("d", d); limb.relleno.setAttribute("d", d);
        mano.setAttribute("cx", r.tx.toFixed(2)); mano.setAttribute("cy", r.ty.toFixed(2));
        return r;
      };
      const sD = p.signoD || (p.mDy < -20 ? -1 : 1);
      const sT = p.signoT || (p.mTy < -20 ? -1 : 1);
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
      this.gorro.setAttribute("opacity", p.gorro ? Math.min(1, p.gorro).toFixed(2) : 0);
      const arriba = ob === "hoja";
      if (arriba !== this._manoArriba) {
        if (arriba) this.cuerpo.appendChild(this.manoT); else this.cuerpo.insertBefore(this.manoT, this.objetoT.nextSibling);
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
  global.Personaje = Personaje;
})(window);
