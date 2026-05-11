ALTER TABLE public.atendidos ADD COLUMN IF NOT EXISTS idade_importada integer;
CREATE UNIQUE INDEX IF NOT EXISTS atendidos_id_externo_uniq ON public.atendidos(id_externo) WHERE id_externo IS NOT NULL;