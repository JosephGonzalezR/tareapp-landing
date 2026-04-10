// Pesos de secciones por tipo de institución
export const SECTION_WEIGHTS = {
  cft: [
    { name: 'Introducción', weight: 12 },
    { name: 'Marco Teórico', weight: 25 },
    { name: 'Metodología', weight: 20 },
    { name: 'Resultados / Propuesta', weight: 30 },
    { name: 'Conclusiones', weight: 13 }
  ],
  ip: [
    { name: 'Introducción', weight: 12 },
    { name: 'Marco Teórico', weight: 25 },
    { name: 'Metodología', weight: 20 },
    { name: 'Resultados / Propuesta', weight: 30 },
    { name: 'Conclusiones', weight: 13 }
  ],
  uni: [
    { name: 'Introducción', weight: 10 },
    { name: 'Marco Teórico', weight: 30 },
    { name: 'Metodología', weight: 18 },
    { name: 'Resultados / Análisis', weight: 30 },
    { name: 'Conclusiones', weight: 12 }
  ],
  master: [
    { name: 'Introducción', weight: 10 },
    { name: 'Marco Teórico / Estado del Arte', weight: 28 },
    { name: 'Marco Metodológico', weight: 18 },
    { name: 'Resultados y Discusión', weight: 32 },
    { name: 'Conclusiones', weight: 12 }
  ],
  doc: [
    { name: 'Introducción', weight: 8 },
    { name: 'Revisión Sistemática', weight: 25 },
    { name: 'Marco Metodológico', weight: 15 },
    { name: 'Resultados', weight: 22 },
    { name: 'Discusión', weight: 18 },
    { name: 'Conclusiones', weight: 12 }
  ]
};

export function buildAnalysisPrompt(institutionType) {
  const weights = SECTION_WEIGHTS[institutionType];
  const weightsText = weights.map(w => `- ${w.name}: ${w.weight}%`).join('\n');

  return `Eres un sistema de análisis de tesis académicas para Tareapp, un servicio chileno de elaboración de tesis.

TAREA: Analiza el documento de tesis subido y determina qué porcentaje está completado.

ESTRUCTURA ESPERADA Y PESOS:
${weightsText}

REGLAS DE ANÁLISIS:
1. Identifica todas las secciones presentes en el documento
2. Mapéalas a la estructura estándar de arriba (las secciones pueden tener nombres diferentes)
3. Para cada sección encontrada, evalúa su completitud en escala 0-100%:
   - 0%: Solo título de sección, sin contenido
   - 10-25%: Esquema breve o viñetas sueltas
   - 25-50%: Borrador parcial, faltan elementos clave
   - 50-75%: Contenido sustancial pero necesita expansión/mejora
   - 75-90%: Casi completo, vacíos menores
   - 90-100%: Sección completamente desarrollada
4. Secciones NO presentes en el documento = 0% de completitud
5. IGNORAR: portada, índice, abstract, dedicatorias, agradecimientos, formato de bibliografía, anexos (estos siempre se incluyen sin costo adicional)
6. Si el documento tiene secciones no convencionales (ej: "propuesta de mejora", "plan de negocio", "diseño de prototipo"), intenta mapearlas a la sección estándar más cercana

FORMATO DE RESPUESTA (solo JSON, sin markdown ni backticks):
{
  "sections": [
    {
      "standard_name": "Introducción",
      "found_name": "Capítulo I: Introducción y Planteamiento del Problema",
      "weight_pct": 10,
      "completion_pct": 75,
      "effective_pct": 7.5,
      "assessment": "Contiene planteamiento del problema y objetivos pero falta la justificación"
    }
  ],
  "total_completion_pct": 42.5,
  "overall_assessment": "La tesis tiene una introducción sólida y un marco teórico parcial..."
}

Donde effective_pct = weight_pct * (completion_pct / 100)
Y total_completion_pct = suma de todos los effective_pct

IMPORTANTE:
- Responde SOLO con JSON válido, sin texto adicional
- Sé conservador en la evaluación (es mejor subestimar que sobreestimar)
- Si el documento está vacío o no es una tesis, devuelve total_completion_pct: 0`;
}
