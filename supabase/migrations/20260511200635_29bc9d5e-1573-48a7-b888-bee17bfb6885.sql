-- Expansão da tabela projetos
ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS id_externo text,
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS local_execucao text,
  ADD COLUMN IF NOT EXISTS atendidos_previstos integer,
  ADD COLUMN IF NOT EXISTS atendidos_realizados integer,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS coordenador_id uuid,
  ADD COLUMN IF NOT EXISTS coordenador_nome text,
  ADD COLUMN IF NOT EXISTS edital_nome text,
  ADD COLUMN IF NOT EXISTS orgao_edital text,
  ADD COLUMN IF NOT EXISTS fonte_recurso text,
  ADD COLUMN IF NOT EXISTS lei_incentivo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS qual_lei_incentivo text,
  ADD COLUMN IF NOT EXISTS numero_processo text,
  ADD COLUMN IF NOT EXISTS numero_termo text,
  ADD COLUMN IF NOT EXISTS patrocinador text,
  ADD COLUMN IF NOT EXISTS parceiro text,
  ADD COLUMN IF NOT EXISTS valor_solicitado numeric,
  ADD COLUMN IF NOT EXISTS valor_aprovado numeric,
  ADD COLUMN IF NOT EXISTS valor_captado numeric,
  ADD COLUMN IF NOT EXISTS valor_executado numeric,
  ADD COLUMN IF NOT EXISTS contrapartida numeric,
  ADD COLUMN IF NOT EXISTS obs_captacao text,
  ADD COLUMN IF NOT EXISTS justificativa text,
  ADD COLUMN IF NOT EXISTS metodologia text,
  ADD COLUMN IF NOT EXISTS resultados_esperados text,
  ADD COLUMN IF NOT EXISTS impacto_social text,
  ADD COLUMN IF NOT EXISTS situacao_prestacao_contas text DEFAULT 'nao_iniciada',
  ADD COLUMN IF NOT EXISTS data_limite_prestacao date,
  ADD COLUMN IF NOT EXISTS arquivado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS projetos_id_externo_uniq ON public.projetos(id_externo) WHERE id_externo IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projetos_numero_uniq ON public.projetos(numero_projeto) WHERE numero_projeto IS NOT NULL;

DROP TRIGGER IF EXISTS trg_projetos_updated_at ON public.projetos;
CREATE TRIGGER trg_projetos_updated_at BEFORE UPDATE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projeto_metas
CREATE TABLE IF NOT EXISTS public.projeto_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  quantidade_prevista numeric,
  quantidade_realizada numeric DEFAULT 0,
  unidade_medida text,
  status text NOT NULL DEFAULT 'nao_iniciada',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projeto_metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_pm ON public.projeto_metas FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_pm ON public.projeto_metas FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_pm ON public.projeto_metas FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_pm ON public.projeto_metas FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- projeto_cronograma
CREATE TABLE IF NOT EXISTS public.projeto_cronograma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  etapa text NOT NULL,
  descricao text,
  data_inicio date,
  data_fim date,
  responsavel text,
  status text NOT NULL DEFAULT 'planejado',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projeto_cronograma ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_pc ON public.projeto_cronograma FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_pc ON public.projeto_cronograma FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_pc ON public.projeto_cronograma FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_pc ON public.projeto_cronograma FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- projeto_orcamento
CREATE TABLE IF NOT EXISTS public.projeto_orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  categoria text,
  descricao text,
  valor_previsto numeric DEFAULT 0,
  valor_executado numeric DEFAULT 0,
  data_despesa date,
  fornecedor text,
  comprovante_url text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projeto_orcamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_po ON public.projeto_orcamento FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_po ON public.projeto_orcamento FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_po ON public.projeto_orcamento FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_po ON public.projeto_orcamento FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- projeto_documentos
CREATE TABLE IF NOT EXISTS public.projeto_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  nome text NOT NULL,
  tipo text,
  url text NOT NULL,
  responsavel text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projeto_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_pd ON public.projeto_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_pd ON public.projeto_documentos FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_pd ON public.projeto_documentos FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_pd ON public.projeto_documentos FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));

-- projeto_fotos
CREATE TABLE IF NOT EXISTS public.projeto_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  atividade_id uuid,
  url text NOT NULL,
  legenda text,
  data_foto date,
  tipo text DEFAULT 'galeria',
  ordem integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projeto_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_pf ON public.projeto_fotos FOR SELECT TO authenticated USING (true);
CREATE POLICY ins_pf ON public.projeto_fotos FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY upd_pf ON public.projeto_fotos FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY del_pf ON public.projeto_fotos FOR DELETE TO authenticated USING (is_admin_or_coord(auth.uid()));