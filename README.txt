Tareapp Landing (v6)

Cómo ver la página
1) Descomprime el ZIP.
2) Abre 'index.html' con tu navegador.
   Recomendado: usar servidor local (evita bloqueos de iframes / rutas).
   - Python: en la carpeta del proyecto, ejecuta: python -m http.server 8000
   - Luego abre: http://localhost:8000

Cómo personalizar rápido
- Archivo: app.js
  Edita el objeto CONFIG:
  - brand
  - whatsappNumber (sin + ni espacios)
  - whatsappDisplay
  - location
  - facebookUrl
  - stats (opcionales)

Dónde editar textos
- Archivo: index.html
  Cambia títulos, servicios y secciones según tu oferta real.
  Importante:
  - “Opiniones” tiene placeholders; reemplázalos por reseñas reales verificables.
  - El sitio está pensado para asesoría/revisión/guía (no suplantar autoría).

Novedades v5
- Barra de progreso superior (scroll progress).
- Scrollspy: resalta la sección activa en la navegación.
- Buscador en FAQ (filtra preguntas en vivo).
- Iconografía SVG consistente (sin depender de librerías externas).
- Secciones adicionales: “¿Es para ti?”, “Modalidad” y “Equipo de apoyo”.

Buenas prácticas (recomendación)
- Antes de pautar anuncios, revisa y completa:
  - privacy.html
  - terms.html
- Si incluyes testimonios, usa autorización o enlaces verificables.
- Mantén una propuesta clara y un CTA principal (WhatsApp).

Estructura
- index.html (landing)
- styles.css (estilos)
- app.js (config + interacciones)
- privacy.html (modelo)
- terms.html (modelo)
- assets/ (logo, favicons, og-image y recursos descargables)
