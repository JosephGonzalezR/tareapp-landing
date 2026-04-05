# PROMPT PARA CLAUDE CODE — Implementar Tabla de Precios + Cotizador IA en Tareapp

## CONTEXTO DEL PROYECTO

El proyecto es el sitio web de **Tareapp** (https://tareapp.ags-ed.com/), un servicio de elaboración de tesis y trabajos académicos en Chile. Actualmente tiene:
- `index.html` → página de trabajos académicos
- `tesis.html` → página de tesis (ya existe con servicios, proceso, testimonios, etc.)

Necesito que crees **2 nuevas páginas** (o integres en la existente de tesis) con la misma estética, paleta de colores, tipografías, navbar, footer y estructura visual del sitio actual:

1. **Página de Planes & Precios de Tesis** (`precios-tesis.html`)
2. **Cotizador Parcial con IA** (`cotizador.html`)

---

## INSTRUCCIONES GENERALES

### Estética y diseño
- **Examina el CSS actual del sitio** (`tesis.html` y `index.html`) y extrae la paleta de colores exacta, tipografías, border-radius, espaciados, sombras, etc.
- Las nuevas páginas deben verse como parte natural del sitio, no como algo pegado.
- Usa el mismo navbar y footer que ya existe en el sitio.
- Reutiliza clases CSS existentes donde sea posible.
- El diseño debe ser **mobile-first** y completamente responsive.

### WhatsApp
- El número de WhatsApp del negocio es: **+56 9 5307 8288** (formato para wa.me: `56953078288`)
- Todos los botones de acción deben abrir WhatsApp con un mensaje pre-llenado contextual.

---

## PÁGINA 1: PRECIOS DE TESIS (`precios-tesis.html`)

### Estructura
1. **Header/Hero** con título "Planes & Precios" y subtítulo descriptivo
2. **Tabs/pestañas** para filtrar por tipo de institución: CFT | Instituto Profesional | Universidad (Pregrado) | Magíster | Doctorado
3. **3 tarjetas de precio** por cada pestaña (cambian dinámicamente al hacer clic en las tabs)
4. **CTA destacado** de cotización parcial (enlaza a `cotizador.html`)
5. **Tabla comparativa** resumen de todos los precios
6. **Sección explicativa** de por qué varían los precios entre instituciones
7. **Link al navbar** de tesis.html para que se pueda acceder desde la navegación

### Los 3 planes

**Plan Estándar** (plan base)
- Documento completo según normativa institucional
- Investigación y redacción profesional
- Marco teórico + metodología
- Formato APA / Vancouver / según guía
- Informe antiplagio
- Máximo **3 correcciones**
- Entrega digital (Word + PDF)

**Plan Preferente** (marcado como "MÁS ELEGIDO")
- Todo lo del plan Estándar
- Máximo **6 correcciones**
- Presentación PPT para defensa
- **1 asesor dedicado** a tu carrera
- Soporte prioritario
- Análisis de datos si aplica

**Plan Élite** (marcado como "MÁXIMO NIVEL")
- Todo lo del plan Preferente
- **Correcciones sin límite**
- Entregas hasta en **1 día o menos**
- **2 asesores:** 1 metodológico + 1 temático
- Presentación PPT profesional
- Guion de exposición completo
- Cuestionario de preguntas y respuestas
- Explicación detallada de la tesis
- Soporte prioritario permanente

### Precios base por institución

| Institución | Estándar | Preferente | Élite |
|---|---|---|---|
| CFT | $60.000 | $100.000 | $150.000 |
| Instituto Profesional | $90.000 | $150.000 | $225.000 |
| Universidad (Pregrado) | $150.000 | $250.000 | $375.000 |
| Magíster | $300.000 | $500.000 | $750.000 |
| Doctorado | $500.000 | $850.000 | $1.250.000 |

### Botones de cada tarjeta
Cada botón de plan debe ser un **enlace a WhatsApp** con el ícono de WhatsApp y un mensaje pre-llenado. Ejemplo:
```
https://wa.me/56953078288?text=Hola%2C%20necesito%20una%20tesis%20de%20CFT%2C%20plan%20Est%C3%A1ndar%20(%2460.000).%20Me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n.
```
El mensaje debe incluir: tipo de institución, nombre del plan y precio.

### CTA de cotización parcial
Sección destacada con el texto:
- Título: "¿Solo necesitas una parte de tu tesis?"
- Texto: "No tienes que contratar el documento completo. Si necesitas solo un capítulo, el marco teórico, la metodología, el análisis de datos o las correcciones, indícanos exactamente qué necesitas y lo cotizamos a tu medida."
- Botón: enlaza a `cotizador.html`

### Notas importantes
- **NO** mostrar fechas/días de entrega en los planes (excepto "1 día o menos" en Élite)
- **NO** decir que todos los planes tienen la misma calidad
- **NO** mostrar formas de pago
- **NO** mostrar cantidad de páginas en la tabla comparativa
- Poner "Servicios Académicos 2026" como badge/etiqueta, nada más
- **NO** usar la palabra "Completo" como nombre de plan (en Chile "completo" = hot dog)

---

## PÁGINA 2: COTIZADOR PARCIAL CON IA (`cotizador.html`)

### Flujo del usuario
1. **Paso 1:** Seleccionar tipo de institución (CFT, IP, Universidad, Magíster, Doctorado)
2. **Paso 2:** Seleccionar plan (Estándar, Preferente, Élite) — muestra el precio total de referencia
3. **Paso 3:** Se abre una **interfaz de chat con IA** donde el usuario describe qué partes necesita

### El chatbot con IA
- Usa la **API de Anthropic** (Claude Sonnet) para analizar lo que el usuario necesita
- El endpoint es `https://api.anthropic.com/v1/messages` con model `claude-sonnet-4-20250514`
- **NO se necesita API key** (el entorno lo maneja automáticamente)
- La IA debe **pedir al usuario que suba o pegue la estructura completa de su tesis** (el índice, la pauta, la guía de la institución)
- En base a la estructura, la IA identifica qué secciones necesita el cliente y calcula el porcentaje del precio total

### Lógica de cálculo de porcentajes
La IA debe **investigar y adaptar los porcentajes** según la estructura real que el cliente proporcione. Sin embargo, como referencia interna base (cuando no hay estructura específica), usar estos pesos:

| Sección | % del total |
|---|---|
| Introducción (planteamiento del problema, objetivos, justificación) | 10% |
| Marco teórico / Revisión bibliográfica | 30% |
| Metodología (diseño, muestra, instrumentos) | 18% |
| Resultados / Análisis de datos | 30% |
| Conclusiones y recomendaciones | 12% |

**IMPORTANTE:**
- **NO incluir** Bibliografía, Anexos, Portada, Índice ni Abstract en el cálculo (van incluidos siempre sin costo adicional)
- Los porcentajes deben sumar 100% considerando SOLO las secciones de contenido real
- Si la estructura del cliente tiene secciones no estándar (ej: "Propuesta de mejora", "Plan de negocio", "Prototipo", etc.), la IA debe indicar que es un caso especial y **redirigir a WhatsApp** con un mensaje como: "Tu estructura tiene secciones específicas que requieren una cotización personalizada. Escríbenos por WhatsApp para darte un precio exacto."

### System prompt para la IA del cotizador

```
Eres el asistente de cotización de Tareapp, un servicio de elaboración de tesis académicas en Chile.

Tu trabajo es:
1. Pedir al cliente que pegue o describa la estructura completa de su tesis (el índice o pauta de su institución)
2. Identificar qué secciones necesita que elaboremos
3. Calcular el precio parcial basándote en el porcentaje que representa cada sección

REGLAS:
- Bibliografía, anexos, portada, índice, abstract y dedicatorias NO se cobran por separado, van incluidos.
- Si el cliente pide la tesis completa, el precio es el total del plan seleccionado.
- Si la estructura tiene secciones no convencionales que no puedes clasificar (ej: "propuesta de mejora", "plan de negocio", "diseño de prototipo", etc.), indica que es un caso especial y que debe consultar por WhatsApp para una cotización personalizada.

PORCENTAJES BASE (ajustar según la estructura real del cliente):
- Introducción (planteamiento, objetivos, justificación): 10%
- Marco teórico / Revisión bibliográfica: 30%
- Metodología: 18%
- Resultados / Análisis: 30%
- Conclusiones y recomendaciones: 12%

Si la estructura del cliente agrupa secciones diferente (ej: "Capítulo 1: Introducción y Marco Teórico"), combina los porcentajes correspondientes.

FORMATO DE RESPUESTA:
- Si necesitas más información, responde con: {"ready": false, "message": "tu pregunta"}
- Si puedes calcular, responde con: {"ready": true, "sections": [{"name": "Sección", "pct": número}], "message": "confirmación amable"}
- Si es caso especial, responde con: {"ready": false, "special": true, "message": "explicación de que debe ir a WhatsApp"}

Responde SOLO JSON puro, sin markdown ni backticks.
```

### Resultado de la cotización
Cuando la IA calcula, mostrar una tarjeta de resultado con:
- Precio total estimado (grande, destacado)
- Desglose por sección (nombre, %, precio)
- Línea de total
- Botón de **WhatsApp** con mensaje pre-llenado que incluya: institución, plan, secciones solicitadas y precio estimado

### Caso especial
Si la IA detecta secciones no convencionales, mostrar un mensaje amable redirigiendo a WhatsApp:
- "Tu tesis tiene una estructura específica que requiere cotización personalizada"
- Botón directo a WhatsApp

---

## INTEGRACIÓN CON EL SITIO

1. Agregar un link a `precios-tesis.html` en el **navbar** de `tesis.html` (como "Precios" o similar)
2. En `tesis.html`, agregar un **CTA o sección** que enlace a la página de precios
3. El botón "Cotizar ahora" del CTA parcial en `precios-tesis.html` debe apuntar a `cotizador.html`
4. En `cotizador.html`, incluir un link "← Volver a planes" que regrese a `precios-tesis.html`

---

## ARCHIVOS DE REFERENCIA

Adjunto 2 archivos HTML que son **prototipos funcionales** de lo que necesito:
- `tabla-precios-tesis.html` → prototipo de la página de precios (dark theme, necesita adaptarse a los colores de Tareapp)
- `cotizador.html` → prototipo del cotizador con IA (dark theme, necesita adaptarse)

Usa estos como referencia de funcionalidad y lógica, pero **adapta completamente el diseño visual** a la estética existente de tareapp.ags-ed.com.

---

## CHECKLIST FINAL

- [ ] Misma paleta de colores, tipografías y estilo que el sitio actual
- [ ] Navbar y footer idénticos al resto del sitio
- [ ] Mobile-first y responsive
- [ ] Botones de planes abren WhatsApp con mensaje contextual al +56 9 5307 8288
- [ ] Tabs funcionan correctamente cambiando precios por institución
- [ ] CTA parcial enlaza al cotizador
- [ ] Cotizador usa API de Anthropic (Claude Sonnet) sin API key
- [ ] IA pide la estructura completa antes de cotizar
- [ ] Bibliografía/anexos/portada NO se incluyen en el cálculo de porcentajes
- [ ] Casos especiales redirigen a WhatsApp
- [ ] Resultado muestra desglose + botón WhatsApp
- [ ] Link en navbar de tesis.html hacia precios
- [ ] Todo en español chileno, sin anglicismos innecesarios
