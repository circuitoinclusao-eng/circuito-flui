
-- Ampliar tabela atividades
ALTER TABLE public.atividades
  ADD COLUMN IF NOT EXISTS quem_pode_participar text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS objetivo_relacionado text,
  ADD COLUMN IF NOT EXISTS resultado_esperado text,
  ADD COLUMN IF NOT EXISTS controle_presenca boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS media_final_conceito boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS formato_execucao text NOT NULL DEFAULT 'curso',
  ADD COLUMN IF NOT EXISTS carga_horaria_horas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carga_horaria_minutos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS numero_vagas integer,
  ADD COLUMN IF NOT EXISTS permite_ultrapassar_limite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date,
  ADD COLUMN IF NOT EXISTS periodo_matutino boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS periodo_vespertino boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS periodo_noturno boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS foto_capa_url text,
  ADD COLUMN IF NOT EXISTS foto_capa_legenda text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- atividade_educadores
CREATE TABLE IF NOT EXISTS public.atividade_educadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (atividade_id, usuario_id)
);
ALTER TABLE public.atividade_educadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_at_edu ON public.atividade_educadores FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_at_edu ON public.atividade_educadores FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_at_edu ON public.atividade_educadores FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_at_edu ON public.atividade_educadores FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- atividade_gestores
CREATE TABLE IF NOT EXISTS public.atividade_gestores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (atividade_id, usuario_id)
);
ALTER TABLE public.atividade_gestores ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_at_gest ON public.atividade_gestores FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_at_gest ON public.atividade_gestores FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_at_gest ON public.atividade_gestores FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_at_gest ON public.atividade_gestores FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- encontros_atividade
CREATE TABLE IF NOT EXISTS public.encontros_atividade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  data date NOT NULL,
  horario_inicio time,
  horario_fim time,
  periodo text,
  status text NOT NULL DEFAULT 'nao_registrada',
  resumo text,
  numero_presentes integer DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encontros_atividade ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_enc ON public.encontros_atividade FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_enc ON public.encontros_atividade FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_enc ON public.encontros_atividade FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_enc ON public.encontros_atividade FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));
CREATE TRIGGER trg_enc_updated BEFORE UPDATE ON public.encontros_atividade FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- atividade_inscritos
CREATE TABLE IF NOT EXISTS public.atividade_inscritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  atendido_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'inscrito',
  data_inscricao date NOT NULL DEFAULT CURRENT_DATE,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (atividade_id, atendido_id)
);
ALTER TABLE public.atividade_inscritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_at_insc ON public.atividade_inscritos FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_at_insc ON public.atividade_inscritos FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_at_insc ON public.atividade_inscritos FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_at_insc ON public.atividade_inscritos FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- presencas_atividade
CREATE TABLE IF NOT EXISTS public.presencas_atividade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encontro_id uuid NOT NULL,
  atendido_id uuid NOT NULL,
  presente boolean NOT NULL DEFAULT false,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (encontro_id, atendido_id)
);
ALTER TABLE public.presencas_atividade ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_pres_at ON public.presencas_atividade FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_pres_at ON public.presencas_atividade FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_pres_at ON public.presencas_atividade FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_pres_at ON public.presencas_atividade FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- atividade_fotos
CREATE TABLE IF NOT EXISTS public.atividade_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  encontro_id uuid,
  tipo_foto text NOT NULL DEFAULT 'galeria',
  url text NOT NULL,
  legenda text,
  data_foto date,
  ordem integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.atividade_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_at_fotos ON public.atividade_fotos FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_at_fotos ON public.atividade_fotos FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_at_fotos ON public.atividade_fotos FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_at_fotos ON public.atividade_fotos FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_enc_atividade ON public.encontros_atividade(atividade_id);
CREATE INDEX IF NOT EXISTS idx_insc_atividade ON public.atividade_inscritos(atividade_id);
CREATE INDEX IF NOT EXISTS idx_fotos_atividade ON public.atividade_fotos(atividade_id);
CREATE INDEX IF NOT EXISTS idx_pres_encontro ON public.presencas_atividade(encontro_id);
