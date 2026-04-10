# Guía de Setup - Cotizador con IA de Tareapp

## Resumen de servicios necesarios

| Servicio | Para qué | Costo |
|----------|----------|-------|
| Supabase | Base de datos + almacenamiento de documentos | Gratis |
| Cloudflare Workers | Backend API (seguro, sin exponer API keys) | Gratis |
| Anthropic (Claude API) | Análisis de documentos con IA | ~$1-3/mes |
| Resend | Envío de emails al admin | Gratis |

---

## Paso 1: Crear cuenta en Supabase

1. Ir a https://supabase.com y crear cuenta gratuita
2. Crear un nuevo proyecto (nombre: `tareapp-cotizador`, región: South America si disponible)
3. Esperar a que se cree el proyecto (~2 minutos)
4. Ir a **SQL Editor** en el menú lateral
5. Pegar el contenido completo de `setup/supabase-schema.sql` y ejecutar
6. Ir a **Storage** > "New Bucket" > nombre: `thesis-documents` > **Private** > Create
7. Guardar estas credenciales (las necesitarás después):
   - **Project URL**: Settings > API > Project URL (ej: `https://xxxx.supabase.co`)
   - **Service Role Key**: Settings > API > service_role key (la secreta, NO la anon key)

---

## Paso 2: Obtener API key de Anthropic (Claude)

1. Ir a https://console.anthropic.com
2. Crear cuenta o iniciar sesión
3. Ir a **API Keys** > Create Key
4. Copiar la key (empieza con `sk-ant-...`)
5. Agregar créditos ($5 USD es suficiente para ~500 análisis)

---

## Paso 3: Crear cuenta en Resend (emails)

1. Ir a https://resend.com y crear cuenta gratuita
2. Ir a **API Keys** > Create API Key
3. Copiar la key (empieza con `re_...`)
4. (Opcional) Verificar tu dominio en **Domains** para enviar desde `@tareapp.cl`
   - Sin dominio verificado, puedes enviar desde `onboarding@resend.dev` para pruebas

---

## Paso 4: Deployar el Cloudflare Worker

### 4.1 Instalar herramientas
```bash
# Instalar Node.js si no lo tienes: https://nodejs.org
# Instalar Wrangler (CLI de Cloudflare)
npm install -g wrangler
```

### 4.2 Autenticarse en Cloudflare
```bash
wrangler login
# Se abre el navegador para autorizar
```

### 4.3 Crear el KV namespace para rate limiting
```bash
cd api-worker
npm install
wrangler kv:namespace create "RATE_LIMIT"
```
Esto devuelve algo como:
```
{ binding = "RATE_LIMIT", id = "abc123..." }
```
Copia el `id` y pégalo en `wrangler.toml` donde dice `id = ""`.

### 4.4 Configurar secrets
```bash
wrangler secret put ANTHROPIC_API_KEY
# Pegar: sk-ant-xxxxx

wrangler secret put SUPABASE_URL
# Pegar: https://xxxx.supabase.co

wrangler secret put SUPABASE_SERVICE_KEY
# Pegar: eyJhbG... (la service_role key de Supabase)

wrangler secret put RESEND_API_KEY
# Pegar: re_xxxxx

wrangler secret put ADMIN_EMAIL
# Pegar: tu-email@gmail.com (donde recibirás las notificaciones)
```

### 4.5 Deployar
```bash
wrangler deploy
```
Esto devuelve la URL del Worker, algo como:
```
https://tareapp-cotizador.TUUSUARIO.workers.dev
```

### 4.6 Actualizar el frontend
Abrir `cotizador/index.html` y cambiar la variable `API_URL` (línea del script) por tu URL del Worker:
```javascript
var API_URL = 'https://tareapp-cotizador.TUUSUARIO.workers.dev';
```

---

## Paso 5: Configurar CORS

En `api-worker/wrangler.toml`, actualizar `ALLOWED_ORIGIN` con tu dominio real:
```toml
[vars]
ALLOWED_ORIGIN = "https://tudominio.com"
```
Luego re-deployar:
```bash
wrangler deploy
```

---

## Paso 6: Probar el sistema

1. Abrir la página del cotizador en tu sitio
2. Seguir los 5 pasos (institución → plan → datos → documento → resultados)
3. Verificar que:
   - La cotización aparece en Supabase Dashboard > Table Editor > quotations
   - Llega el email de notificación
   - El botón de WhatsApp tiene los datos correctos
4. Probar el rate limiting: intentar cotizar de nuevo con el mismo teléfono

---

## Panel de Admin (Supabase Dashboard)

Para revisar cotizaciones:
1. Ir a Supabase Dashboard > Table Editor > `quotations`
2. Ver las cotizaciones pendientes (filtrar por `admin_verified = false`)
3. Para verificar una cotización:
   - Revisar el documento en `document_url`
   - Revisar el análisis en `ai_analysis`
   - Ajustar precio si es necesario en `admin_adjusted_price`
   - Marcar `admin_verified = true`
   - Agregar notas en `admin_notes`

Para ver el resumen diario:
- Ir a SQL Editor y ejecutar: `SELECT * FROM daily_summary;`

---

## Costos estimados

Con 100 cotizaciones al mes:
- **Supabase**: $0 (dentro del free tier)
- **Cloudflare Workers**: $0 (dentro del free tier)
- **Claude API**: ~$1-3 USD/mes (~$0.01-0.03 por análisis)
- **Resend**: $0 (100 emails/día gratis)
- **Total**: ~$1-3 USD/mes

---

## Troubleshooting

### "Error de conexión" en el cotizador
- Verificar que la URL del Worker es correcta en `API_URL`
- Verificar que CORS permite tu dominio
- Abrir la consola del navegador (F12) para ver errores

### "Rate limited" al probar
- Cada teléfono puede cotizar 1 vez cada 24 horas
- Para testing, usar diferentes números o limpiar el KV:
  ```bash
  wrangler kv:key delete --namespace-id=TU_KV_ID "rate:+56912345678"
  ```

### No llegan los emails
- Verificar que `RESEND_API_KEY` y `ADMIN_EMAIL` están configurados
- Sin dominio verificado, el email puede llegar a spam
- Revisar logs del Worker: `wrangler tail`

### El análisis de IA no funciona bien
- PDFs escaneados (imágenes) no se pueden leer como texto
- Recomendar a los usuarios que suban archivos Word (.docx) cuando sea posible
- El texto pegado manualmente funciona como alternativa confiable
