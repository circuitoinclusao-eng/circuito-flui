
-- Sequência para matrícula automática
CREATE SEQUENCE IF NOT EXISTS public.atendidos_matricula_seq START 1000;

CREATE TABLE public.atendidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula text UNIQUE NOT NULL DEFAULT ('CI-' || lpad(nextval('public.atendidos_matricula_seq')::text, 6, '0')),
  nome text NOT NULL,
  foto_url text,
  data_nascimento date,
  cpf text,
  rg text,
  telefone text,
  whatsapp text,
  email text,
  cidade text,
  bairro text,
  endereco text,
  cep text,
  status text NOT NULL DEFAULT 'ativo',
  matricula_familia text,
  responsavel_nome text,
  responsavel_parentesco text,
  responsavel_telefone text,
  responsavel_email text,
  numero_pessoas_familia integer,
  observacoes_familiares text,
  pessoa_com_deficiencia text DEFAULT 'nao_informado',
  tipo_deficiencia text,
  necessidade_apoio text,
  mobilidade_reduzida boolean DEFAULT false,
  usa_cadeira_rodas boolean DEFAULT false,
  comunicacao_alternativa boolean DEFAULT false,
  restricao_saude text,
  observacoes_acessibilidade text,
  demanda_inicial text,
  encaminhamento text,
  proximo_retorno date,
  observacoes text,
  autorizacao_imagem boolean DEFAULT false,
  aceite_participacao boolean DEFAULT false,
  observacoes_legais text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_atendidos_nome ON public.atendidos (lower(nome));
CREATE INDEX idx_atendidos_cpf ON public.atendidos (cpf);
CREATE INDEX idx_atendidos_status ON public.atendidos (status);

CREATE TABLE public.atendido_projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendido_id uuid NOT NULL REFERENCES public.atendidos(id) ON DELETE CASCADE,
  projeto_id uuid REFERENCES public.projetos(id) ON DELETE SET NULL,
  atividade_id uuid REFERENCES public.atividades(id) ON DELETE SET NULL,
  grupo_id uuid REFERENCES public.grupos(id) ON DELETE SET NULL,
  data_entrada date DEFAULT CURRENT_DATE,
  status text DEFAULT 'ativo',
  responsavel_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_atendido_projetos_atendido ON public.atendido_projetos (atendido_id);

CREATE TABLE public.atendido_marcadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendido_id uuid NOT NULL REFERENCES public.atendidos(id) ON DELETE CASCADE,
  marcador text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (atendido_id, marcador)
);
CREATE INDEX idx_atendido_marcadores_atendido ON public.atendido_marcadores (atendido_id);

CREATE TABLE public.atendido_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendido_id uuid NOT NULL REFERENCES public.atendidos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_atendido_documentos_atendido ON public.atendido_documentos (atendido_id);

CREATE TABLE public.historico_atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendido_id uuid NOT NULL REFERENCES public.atendidos(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  tipo text,
  demanda text,
  encaminhamento text,
  responsavel_id uuid,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_historico_atendimentos_atendido ON public.historico_atendimentos (atendido_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_atendidos_updated
BEFORE UPDATE ON public.atendidos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.atendidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendido_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendido_marcadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendido_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_atendimentos ENABLE ROW LEVEL SECURITY;

-- atendidos
CREATE POLICY "view_atendidos" ON public.atendidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_atendidos" ON public.atendidos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "upd_atendidos" ON public.atendidos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "del_atendidos" ON public.atendidos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- atendido_projetos
CREATE POLICY "view_at_proj" ON public.atendido_projetos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_at_proj" ON public.atendido_projetos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "upd_at_proj" ON public.atendido_projetos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "del_at_proj" ON public.atendido_projetos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- atendido_marcadores
CREATE POLICY "view_at_marc" ON public.atendido_marcadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_at_marc" ON public.atendido_marcadores FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "del_at_marc" ON public.atendido_marcadores FOR DELETE TO authenticated USING (public.can_edit(auth.uid()));

-- atendido_documentos
CREATE POLICY "view_at_doc" ON public.atendido_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_at_doc" ON public.atendido_documentos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "upd_at_doc" ON public.atendido_documentos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "del_at_doc" ON public.atendido_documentos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- historico_atendimentos
CREATE POLICY "view_hist_at" ON public.historico_atendimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_hist_at" ON public.historico_atendimentos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "upd_hist_at" ON public.historico_atendimentos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "del_hist_at" ON public.historico_atendimentos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Bucket para fotos e documentos de atendidos
INSERT INTO storage.buckets (id, name, public)
VALUES ('atendidos', 'atendidos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "atendidos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'atendidos');
CREATE POLICY "atendidos_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'atendidos');
CREATE POLICY "atendidos_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'atendidos');
CREATE POLICY "atendidos_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'atendidos');
