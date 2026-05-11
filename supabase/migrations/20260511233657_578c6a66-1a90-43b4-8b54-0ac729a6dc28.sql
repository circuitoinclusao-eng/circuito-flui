ALTER TABLE public.presencas_atividade
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'falta';

UPDATE public.presencas_atividade
SET status = CASE WHEN presente THEN 'presente' ELSE 'falta' END
WHERE status = 'falta';

ALTER TABLE public.presencas_atividade
ADD CONSTRAINT presencas_atividade_status_chk
CHECK (status IN ('presente','falta','justificada'));