import { buildAnalysisPrompt, SECTION_WEIGHTS } from './prompts.js';

// ============================================================
// PRECIOS (deben coincidir con precios/index.html)
// ============================================================
const PRICES = {
  cft:    { estandar: 150000, preferente: 250000, elite: 375000 },
  ip:     { estandar: 250000, preferente: 420000, elite: 625000 },
  uni:    { estandar: 350000, preferente: 585000, elite: 875000 },
  master: { estandar: 550000, preferente: 920000, elite: 1375000 },
  doc:    { estandar: 950000, preferente: 1615000, elite: 2375000 }
};

const INST_LABELS = {
  cft: 'CFT', ip: 'Instituto Profesional', uni: 'Universidad (Pregrado)',
  master: 'Magíster', doc: 'Doctorado'
};
const PLAN_LABELS = { estandar: 'Estándar', preferente: 'Preferente', elite: 'Élite' };

// ============================================================
// CORS
// ============================================================
function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }
  });
}

// ============================================================
// RATE LIMITING (KV)
// ============================================================
async function checkRateLimit(phone, env) {
  const key = `rate:${phone}`;
  const existing = await env.RATE_LIMIT.get(key);
  if (existing) return false; // ya cotizó hoy
  return true;
}

async function setRateLimit(phone, env) {
  const key = `rate:${phone}`;
  // Expira en 24 horas (86400 segundos)
  await env.RATE_LIMIT.put(key, Date.now().toString(), { expirationTtl: 86400 });
}

// ============================================================
// SUPABASE
// ============================================================
async function saveToSupabase(data, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Supabase error: ${error}`);
  }

  const rows = await res.json();
  return rows[0];
}

async function uploadDocument(file, filename, env) {
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `uploads/${timestamp}_${safeName}`;

  const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/thesis-documents/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Storage error: ${error}`);
  }

  return `${env.SUPABASE_URL}/storage/v1/object/thesis-documents/${path}`;
}

// ============================================================
// EXTRAER TEXTO DE DOCX
// ============================================================
function extractTextFromDocx(buffer) {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(buffer);
  const xmlTextRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
  let m;
  const parts = [];
  while ((m = xmlTextRegex.exec(raw)) !== null) {
    parts.push(m[1]);
  }
  return parts.join(' ').trim();
}

// ============================================================
// CLAUDE API - Análisis de documento
// ============================================================
async function analyzeWithClaude(files, textContent, institutionType, env) {
  const systemPrompt = buildAnalysisPrompt(institutionType);

  // Construir contenido del mensaje
  const contentParts = [];

  for (const file of files) {
    if (!file.data) continue;

    if (file.mediaType === 'application/pdf') {
      // PDFs: enviar como document nativo (Claude los lee directo)
      contentParts.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: file.data
        }
      });
      contentParts.push({
        type: 'text',
        text: `[Archivo PDF: ${file.name}]`
      });
    } else {
      // DOCX: extraer texto y enviar como texto
      const bytes = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
      const text = extractTextFromDocx(bytes.buffer);
      if (text.length > 50) {
        contentParts.push({
          type: 'text',
          text: `[Contenido del archivo "${file.name}"]:\n\n${text}`
        });
      } else {
        contentParts.push({
          type: 'text',
          text: `[Archivo "${file.name}" - no se pudo extraer texto legible del DOCX]`
        });
      }
    }
  }

  // Agregar texto manual si hay
  if (textContent) {
    contentParts.push({
      type: 'text',
      text: `Información adicional del estudiante:\n\n${textContent}`
    });
  }

  // Instrucción final
  contentParts.push({
    type: 'text',
    text: 'Analiza los documentos anteriores. El primero es la pauta/guía institucional con la estructura requerida. El segundo es el avance del estudiante. Compara ambos y calcula el porcentaje de completitud de la tesis.'
  });

  // Si no hay contenido real, agregar nota
  if (contentParts.length <= 1) {
    contentParts.unshift({
      type: 'text',
      text: 'No se pudieron leer los documentos. Asume 0% de completitud.'
    });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: contentParts }]
    })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await res.json();
  const rawText = data.content.map(c => c.text || '').join('').trim();

  const clean = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ============================================================
// EXTRAER TEXTO DE PDF (básico - extrae texto embebido)
// ============================================================
async function extractTextFromPDF(arrayBuffer) {
  // Extracción básica de texto de PDF
  // Para PDFs complejos, Claude puede leer el PDF directamente
  const bytes = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // Intentar extraer texto legible entre streams de PDF
  const textParts = [];
  const streamRegex = /stream\s*([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const content = match[1].trim();
    // Filtrar contenido binario
    if (content.length > 10 && /[a-záéíóúñ]{3,}/i.test(content)) {
      textParts.push(content);
    }
  }

  // Si no encontramos texto en streams, intentar BT/ET blocks
  if (textParts.length === 0) {
    const btRegex = /BT\s*([\s\S]*?)ET/g;
    while ((match = btRegex.exec(text)) !== null) {
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(match[1])) !== null) {
        textParts.push(tjMatch[1]);
      }
    }
  }

  return textParts.join('\n').trim();
}

// ============================================================
// ENVIAR EMAIL CON RESEND
// ============================================================
async function sendAdminEmail(quotation, env) {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL) return;

  const instLabel = INST_LABELS[quotation.institution_type] || quotation.institution_type;
  const planLabel = PLAN_LABELS[quotation.plan_type] || quotation.plan_type;

  const formatCLP = (n) => '$' + Math.round(n).toLocaleString('es-CL');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#E5B52E">Nueva Cotización - Tareapp</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Nombre</td><td style="padding:8px;border-bottom:1px solid #eee">${quotation.student_name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Teléfono</td><td style="padding:8px;border-bottom:1px solid #eee">${quotation.student_phone}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${quotation.student_email}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Carrera</td><td style="padding:8px;border-bottom:1px solid #eee">${quotation.student_career}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Institución</td><td style="padding:8px;border-bottom:1px solid #eee">${instLabel}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Plan</td><td style="padding:8px;border-bottom:1px solid #eee">${planLabel}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Precio Total</td><td style="padding:8px;border-bottom:1px solid #eee">${formatCLP(quotation.full_price)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">% Completado</td><td style="padding:8px;border-bottom:1px solid #eee">${quotation.completion_pct}%</td></tr>
        <tr style="background:#f8f8f8"><td style="padding:12px;font-weight:700;font-size:16px">Precio Cotizado</td><td style="padding:12px;font-weight:700;font-size:16px;color:#34d399">${formatCLP(quotation.quoted_price)}</td></tr>
      </table>
      ${quotation.document_url ? `<p><a href="${quotation.document_url}" style="color:#E5B52E">Ver documento subido</a></p>` : ''}
      <p style="color:#888;font-size:12px">Verifica en Supabase Dashboard > Table Editor > quotations</p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Tareapp Cotizador <cotizador@tareapp.cl>',
      to: [env.ADMIN_EMAIL],
      subject: `Nueva cotización: ${quotation.student_name} - ${instLabel} ${planLabel} - ${formatCLP(quotation.quoted_price)}`,
      html
    })
  });
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    try {
      // GET /api/rate-check?phone=XXXXX
      if (url.pathname === '/api/rate-check' && request.method === 'GET') {
        const phone = url.searchParams.get('phone');
        if (!phone) return jsonResponse({ error: 'Falta el teléfono' }, 400, env);

        const allowed = await checkRateLimit(phone, env);
        return jsonResponse({ allowed }, 200, env);
      }

      // POST /api/analyze
      if (url.pathname === '/api/analyze' && request.method === 'POST') {
        const formData = await request.formData();

        // Extraer campos
        const studentName = formData.get('student_name');
        const studentPhone = formData.get('student_phone');
        const studentEmail = formData.get('student_email');
        const studentCareer = formData.get('student_career');
        const institutionType = formData.get('institution_type');
        const planType = formData.get('plan_type');
        const guideFile = formData.get('guide_document'); // Pauta/guía institucional
        const progressFile = formData.get('progress_document'); // Documento de avance
        const manualText = formData.get('manual_text'); // Texto pegado manualmente

        // Validaciones
        if (!studentName || !studentPhone || !studentEmail || !studentCareer) {
          return jsonResponse({ error: 'Faltan datos del estudiante' }, 400, env);
        }
        if (!institutionType || !PRICES[institutionType]) {
          return jsonResponse({ error: 'Tipo de institución inválido' }, 400, env);
        }
        if (!planType || !PRICES[institutionType][planType]) {
          return jsonResponse({ error: 'Tipo de plan inválido' }, 400, env);
        }
        if (!guideFile && !progressFile && !manualText) {
          return jsonResponse({ error: 'Debes subir al menos un documento o pegar tu estructura' }, 400, env);
        }

        // Rate limiting
        const allowed = await checkRateLimit(studentPhone, env);
        if (!allowed) {
          return jsonResponse({
            error: 'Ya realizaste una cotización hoy. Puedes volver a cotizar mañana.',
            rate_limited: true
          }, 429, env);
        }

        // Obtener precio total
        const fullPrice = PRICES[institutionType][planType];

        // Procesar archivos para enviar directo a Claude (base64)
        const filesToAnalyze = [];
        let documentUrl = null;
        let documentFilename = null;
        let documentSize = 0;

        async function processFile(file, label) {
          if (!file || file.size === 0) return;
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`El archivo ${label} no debe superar los 10MB`);
          }
          // Solo PDF — DOCX no se puede leer correctamente
          if (!file.name.toLowerCase().endsWith('.pdf')) {
            throw new Error(`El archivo ${label} debe ser PDF. Si tienes Word, expórtalo como PDF (Archivo → Guardar como → PDF).`);
          }

          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
          }
          const base64 = btoa(binary);

          filesToAnalyze.push({
            name: file.name,
            data: base64,
            mediaType: 'application/pdf',
            size: file.size
          });

          return file;
        }

        try {
          await processFile(guideFile, 'pauta/guía');
          const mainFile = await processFile(progressFile, 'avance');
          if (mainFile) {
            documentFilename = mainFile.name;
            documentSize = mainFile.size;
          } else if (guideFile) {
            documentFilename = guideFile.name;
            documentSize = guideFile.size;
          }
        } catch (e) {
          return jsonResponse({ error: e.message }, 400, env);
        }

        // Subir documento de avance a Supabase Storage
        const fileToUpload = progressFile || guideFile;
        if (fileToUpload && fileToUpload.size > 0) {
          try {
            documentUrl = await uploadDocument(fileToUpload, fileToUpload.name, env);
          } catch (e) {
            console.error('Error uploading:', e);
          }
        }

        // Analizar con Claude (envía archivos como base64 directo)
        let analysis;
        try {
          analysis = await analyzeWithClaude(filesToAnalyze, manualText, institutionType, env);
        } catch (e) {
          console.error('Claude analysis error:', e.message, e.stack);
          // Fallback: asignar 0% si Claude falla
          const weights = SECTION_WEIGHTS[institutionType];
          analysis = {
            sections: weights.map(w => ({
              standard_name: w.name,
              found_name: 'No encontrada',
              weight_pct: w.weight,
              completion_pct: 0,
              effective_pct: 0,
              assessment: 'No se pudo analizar automáticamente'
            })),
            total_completion_pct: 0,
            overall_assessment: 'El análisis automático no pudo completarse. Un asesor revisará tu documento manualmente.'
          };
        }

        const completionPct = Math.min(Math.max(analysis.total_completion_pct || 0, 0), 95);
        const remainingPct = 100 - completionPct;
        const quotedPrice = Math.round(fullPrice * (remainingPct / 100));

        // Guardar en Supabase
        let savedQuotation = null;
        try {
          savedQuotation = await saveToSupabase({
            student_name: studentName,
            student_phone: studentPhone,
            student_email: studentEmail,
            student_career: studentCareer,
            institution_type: institutionType,
            plan_type: planType,
            full_price: fullPrice,
            completion_pct: completionPct,
            quoted_price: quotedPrice,
            ai_analysis: analysis,
            document_url: documentUrl,
            document_filename: documentFilename,
            document_size_bytes: documentSize,
            client_ip: request.headers.get('CF-Connecting-IP') || 'unknown',
            user_agent: request.headers.get('User-Agent') || 'unknown'
          }, env);
        } catch (e) {
          console.error('Supabase save error:', e);
        }

        // Marcar rate limit
        await setRateLimit(studentPhone, env);

        // Enviar email al admin
        try {
          await sendAdminEmail({
            student_name: studentName,
            student_phone: studentPhone,
            student_email: studentEmail,
            student_career: studentCareer,
            institution_type: institutionType,
            plan_type: planType,
            full_price: fullPrice,
            completion_pct: completionPct,
            quoted_price: quotedPrice,
            document_url: documentUrl
          }, env);
        } catch (e) {
          console.error('Email error:', e);
        }

        return jsonResponse({
          success: true,
          quote_id: savedQuotation?.id || null,
          completion_pct: completionPct,
          remaining_pct: remainingPct,
          full_price: fullPrice,
          quoted_price: quotedPrice,
          sections: analysis.sections || [],
          overall_assessment: analysis.overall_assessment || '',
          institution_label: INST_LABELS[institutionType],
          plan_label: PLAN_LABELS[planType]
        }, 200, env);
      }

      return jsonResponse({ error: 'Ruta no encontrada' }, 404, env);

    } catch (err) {
      console.error('Unhandled error:', err);
      return jsonResponse({ error: 'Error interno del servidor' }, 500, env);
    }
  }
};
