-- ============================================================
-- TAREAPP COTIZADOR - Esquema de Base de Datos (Supabase)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabla principal de cotizaciones
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Datos del estudiante
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_career TEXT NOT NULL,

    -- Selección de plan
    institution_type TEXT NOT NULL CHECK (institution_type IN ('cft', 'ip', 'uni', 'master', 'doc')),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('estandar', 'preferente', 'elite')),
    full_price INTEGER NOT NULL,

    -- Análisis IA
    completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    quoted_price INTEGER NOT NULL,
    ai_analysis JSONB NOT NULL DEFAULT '{}',
    -- ai_analysis contiene:
    -- {
    --   "sections": [
    --     {"standard_name": "Introducción", "found_name": "Cap 1", "weight_pct": 10, "completion_pct": 75, "effective_pct": 7.5, "assessment": "..."}
    --   ],
    --   "total_completion_pct": 42.5,
    --   "overall_assessment": "..."
    -- }

    -- Documento subido
    document_url TEXT,
    document_filename TEXT,
    document_size_bytes INTEGER,

    -- Verificación del admin
    admin_verified BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    admin_adjusted_price INTEGER,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,

    -- Seguimiento
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'contacted', 'converted', 'rejected')),
    contacted_at TIMESTAMPTZ,
    whatsapp_sent BOOLEAN DEFAULT FALSE,

    -- Metadata técnica
    client_ip TEXT,
    user_agent TEXT
);

-- 2. Índices para consultas frecuentes
CREATE INDEX idx_quotations_phone_date ON quotations (student_phone, created_at DESC);
CREATE INDEX idx_quotations_status ON quotations (status, created_at DESC);
CREATE INDEX idx_quotations_unverified ON quotations (admin_verified, created_at DESC);
CREATE INDEX idx_quotations_institution ON quotations (institution_type, plan_type);

-- 3. Vista para panel de admin (cotizaciones pendientes)
CREATE VIEW pending_reviews AS
SELECT
    id,
    created_at,
    student_name,
    student_phone,
    student_email,
    student_career,
    institution_type,
    plan_type,
    full_price,
    completion_pct,
    quoted_price,
    document_url,
    document_filename,
    admin_verified,
    status,
    CASE
        WHEN institution_type = 'cft' THEN 'CFT'
        WHEN institution_type = 'ip' THEN 'Instituto Profesional'
        WHEN institution_type = 'uni' THEN 'Universidad (Pregrado)'
        WHEN institution_type = 'master' THEN 'Magíster'
        WHEN institution_type = 'doc' THEN 'Doctorado'
    END AS institution_label,
    CASE
        WHEN plan_type = 'estandar' THEN 'Estándar'
        WHEN plan_type = 'preferente' THEN 'Preferente'
        WHEN plan_type = 'elite' THEN 'Élite'
    END AS plan_label
FROM quotations
WHERE admin_verified = FALSE
ORDER BY created_at DESC;

-- 4. Vista de resumen diario
CREATE VIEW daily_summary AS
SELECT
    DATE(created_at) AS fecha,
    COUNT(*) AS total_cotizaciones,
    COUNT(*) FILTER (WHERE admin_verified) AS verificadas,
    COUNT(*) FILTER (WHERE status = 'converted') AS convertidas,
    ROUND(AVG(completion_pct), 1) AS avg_completion,
    SUM(quoted_price) AS revenue_potencial
FROM quotations
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- 5. Función para verificar rate limiting (1 cotización por teléfono por día)
CREATE OR REPLACE FUNCTION check_rate_limit(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM quotations
        WHERE student_phone = phone
        AND created_at > now() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Storage bucket para documentos
-- Ejecutar en Supabase Dashboard > Storage > New Bucket
-- Nombre: thesis-documents
-- Public: NO (privado)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- 7. Row Level Security (RLS)
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Solo el service_role puede insertar (desde el Worker)
CREATE POLICY "Worker can insert quotations"
ON quotations FOR INSERT
TO service_role
WITH CHECK (true);

-- Solo el service_role puede leer (admin via Supabase Dashboard)
CREATE POLICY "Service role full access"
ON quotations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 8. Trigger para notificar nuevas cotizaciones (opcional, para webhooks)
CREATE OR REPLACE FUNCTION notify_new_quotation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('new_quotation', json_build_object(
        'id', NEW.id,
        'name', NEW.student_name,
        'phone', NEW.student_phone,
        'price', NEW.quoted_price
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_quotation
    AFTER INSERT ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_quotation();
