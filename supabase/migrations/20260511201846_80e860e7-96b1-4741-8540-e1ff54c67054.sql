DROP INDEX IF EXISTS public.atendidos_id_externo_uniq;
ALTER TABLE public.atendidos
  DROP CONSTRAINT IF EXISTS atendidos_id_externo_key;
ALTER TABLE public.atendidos
  ADD CONSTRAINT atendidos_id_externo_key UNIQUE (id_externo);