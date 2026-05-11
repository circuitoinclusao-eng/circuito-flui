
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('administrador', 'coordenador', 'colaborador', 'consulta');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coord(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('administrador','coordenador')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_edit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('administrador','coordenador','colaborador')
  )
$$;

-- Trigger criar profile + role default ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email
  );

  SELECT COUNT(*) INTO user_count FROM public.profiles;

  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrador');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'colaborador');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Editais
CREATE TABLE public.editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  organizacao TEXT,
  link TEXT,
  valor NUMERIC,
  data_inicio DATE,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'aberto',
  requisitos TEXT,
  documentos_necessarios TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.editais ENABLE ROW LEVEL SECURITY;

-- Projetos
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  numero_projeto TEXT,
  edital_id UUID REFERENCES public.editais(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  cidade TEXT,
  territorio TEXT,
  publico_alvo TEXT,
  descricao TEXT,
  objetivo_geral TEXT,
  objetivos_especificos TEXT,
  metas TEXT,
  indicadores TEXT,
  orcamento_previsto NUMERIC,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- Atividades
CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT,
  data DATE,
  horario_inicio TIME,
  horario_fim TIME,
  local TEXT,
  facilitador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participantes_previstos INT DEFAULT 0,
  participantes_atendidos INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planejada',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- Planos mensais
CREATE TABLE public.planos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  mes INT NOT NULL,
  ano INT NOT NULL,
  plano TEXT,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (atividade_id, mes, ano)
);
ALTER TABLE public.planos_mensais ENABLE ROW LEVEL SECURITY;

-- Fechamentos mensais
CREATE TABLE public.fechamentos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  mes INT NOT NULL,
  ano INT NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'aberto',
  resumo_realizado TEXT,
  quantidade_encontros INT DEFAULT 0,
  total_atendidos INT DEFAULT 0,
  resultados TEXT,
  dificuldades TEXT,
  encaminhamentos TEXT,
  depoimentos TEXT,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_fechamento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (atividade_id, mes, ano)
);
ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

-- Contatos
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  telefone TEXT,
  email TEXT,
  organizacao TEXT,
  cidade TEXT,
  tags TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- Atendimentos
CREATE TABLE public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT,
  nome_atendido TEXT NOT NULL,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  demanda TEXT,
  encaminhamento TEXT,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'aberto',
  retorno TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

-- Grupos
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL,
  cidade TEXT,
  territorio TEXT,
  local TEXT,
  dia_horario TEXT,
  facilitador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contato_principal TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

-- Presencas
CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  nome_participante TEXT,
  presente BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- Fotos
CREATE TABLE public.fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  mes INT,
  ano INT,
  url TEXT NOT NULL,
  legenda TEXT,
  data_foto DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;

-- Documentos
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- ===== RLS Policies =====
-- Profiles
CREATE POLICY "auth_select_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "self_update_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_manage_profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- user_roles
CREATE POLICY "auth_view_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- Helper: macro para tabelas comuns (read-all-auth, edit by coord/admin, colab insert)
-- Editais
CREATE POLICY "view_editais" ON public.editais FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_editais" ON public.editais FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_coord(auth.uid()));
CREATE POLICY "update_editais" ON public.editais FOR UPDATE TO authenticated USING (public.is_admin_or_coord(auth.uid()));
CREATE POLICY "delete_editais" ON public.editais FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'administrador'));

-- Projetos
CREATE POLICY "view_projetos" ON public.projetos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_projetos" ON public.projetos FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_coord(auth.uid()));
CREATE POLICY "update_projetos" ON public.projetos FOR UPDATE TO authenticated USING (public.is_admin_or_coord(auth.uid()));
CREATE POLICY "delete_projetos" ON public.projetos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'administrador'));

-- Atividades
CREATE POLICY "view_atividades" ON public.atividades FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_atividades" ON public.atividades FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_coord(auth.uid()));
CREATE POLICY "update_atividades" ON public.atividades FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "delete_atividades" ON public.atividades FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'administrador'));

-- Planos mensais
CREATE POLICY "view_planos" ON public.planos_mensais FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_planos" ON public.planos_mensais FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "update_planos" ON public.planos_mensais FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "delete_planos" ON public.planos_mensais FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Fechamentos
CREATE POLICY "view_fech" ON public.fechamentos_mensais FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_fech" ON public.fechamentos_mensais FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "update_fech" ON public.fechamentos_mensais FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "delete_fech" ON public.fechamentos_mensais FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Atendimentos
CREATE POLICY "view_atend" ON public.atendimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_atend" ON public.atendimentos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "update_atend" ON public.atendimentos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "delete_atend" ON public.atendimentos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Grupos
CREATE POLICY "view_grupos" ON public.grupos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_grupos" ON public.grupos FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_coord(auth.uid()));
CREATE POLICY "update_grupos" ON public.grupos FOR UPDATE TO authenticated USING (public.is_admin_or_coord(auth.uid()));
CREATE POLICY "delete_grupos" ON public.grupos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'administrador'));

-- Contatos
CREATE POLICY "view_contatos" ON public.contatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_contatos" ON public.contatos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "update_contatos" ON public.contatos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "delete_contatos" ON public.contatos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Presencas
CREATE POLICY "view_pres" ON public.presencas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_pres" ON public.presencas FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "upd_pres" ON public.presencas FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "del_pres" ON public.presencas FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Fotos
CREATE POLICY "view_fotos" ON public.fotos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_fotos" ON public.fotos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "upd_fotos" ON public.fotos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "del_fotos" ON public.fotos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Documentos
CREATE POLICY "view_docs" ON public.documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_docs" ON public.documentos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "upd_docs" ON public.documentos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "del_docs" ON public.documentos FOR DELETE TO authenticated USING (public.is_admin_or_coord(auth.uid()));

-- Storage bucket fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', true) ON CONFLICT DO NOTHING;

CREATE POLICY "fotos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "fotos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "fotos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos');
CREATE POLICY "fotos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos' AND public.is_admin_or_coord(auth.uid()));
