## Plano: Reformular módulo Atividades

Vou expandir o módulo Atividades para incluir calendário de encontros, inscritos com abas, galeria de fotos e edição completa por blocos, mantendo a identidade visual do Circuito Inclusão.

### 1. Banco de dados (1 migration)

Ampliar tabela `atividades` adicionando colunas:
- `quem_pode_participar`, `descricao`, `objetivo_relacionado`, `resultado_esperado`
- `controle_presenca` (bool), `media_final_conceito` (bool)
- `formato_execucao` ('curso' | 'atividade_unica')
- `carga_horaria_horas`, `carga_horaria_minutos`, `numero_vagas`, `permite_ultrapassar_limite`
- `data_inicio`, `data_fim`, `periodo_matutino`, `periodo_vespertino`, `periodo_noturno`
- `foto_capa_url`, `foto_capa_legenda`

Criar novas tabelas com RLS (mesmas policies dos demais: `view`=true, `ins/upd`=can_edit, `del`=is_admin_or_coord):
- `atividade_educadores` (atividade_id, usuario_id)
- `atividade_gestores` (atividade_id, usuario_id)
- `encontros_atividade` (data, horario_inicio/fim, periodo, status, resumo, numero_presentes, observacoes)
- `atividade_inscritos` (atendido_id, status: inscrito/espera/removido, data_inscricao, observacoes)
- `presencas_atividade` (encontro_id, atendido_id, presente, observacao)
- `atividade_fotos` (atividade_id, encontro_id, tipo_foto, url, legenda, data_foto, ordem)

### 2. Tela de detalhe `/atividades/$id`

Reescrever com seções:
- **Header**: breadcrumb, título "Detalhe de [nome] – Projeto nº [num]", foto de capa com upload
- **Calendário de aulas**: tabela com data/horário/período/status + botão "Registrar" (modal), criar/excluir encontros, legenda colorida de status
- **Lista de inscritos**: 3 abas (Inscritos / Em espera / Removidos), busca de atendidos para adicionar, ações detalhes/editar/remover
- **Galeria**: grid de fotos da atividade + encontros, filtro por mês/encontro, upload múltiplo
- **Botão "Gerar arquivo"**: dropdown com lista CSV de inscritos e relatório de presença

### 3. Tela de edição `/atividades/$id/editar`

Form em 5 blocos colapsáveis: Dados gerais, Responsáveis, Configurações, Período, Imagens. Botões: Excluir, Cancelar, Salvar.

### 4. Modal "Registrar encontro"

Component reutilizável: status, data/hora/período, resumo, presentes, observações, upload múltiplo de fotos do encontro. Se `controle_presenca` ativo, lista os inscritos com checkbox presente/ausente.

### 5. Mobile

Tabelas viram cards no <md, botões grandes, input file com `capture="environment"` para abrir câmera.

### 6. Arquivos a criar/editar

Novos:
- `supabase/migrations/<timestamp>_atividades_modulo_completo.sql`
- `src/lib/atividades.ts` (helpers de CRUD)
- `src/components/atividades/CapaUpload.tsx`
- `src/components/atividades/CalendarioEncontros.tsx`
- `src/components/atividades/RegistrarEncontroDialog.tsx`
- `src/components/atividades/ListaInscritos.tsx`
- `src/components/atividades/GaleriaAtividade.tsx`
- `src/components/atividades/AtividadeForm.tsx`

Editados:
- `src/routes/_app/atividades/$id/index.tsx` (detalhe completo)
- `src/routes/_app/atividades/$id/editar.tsx` (form em blocos)
- `src/routes/_app/atividades/novo.tsx` (usar AtividadeForm)
- `src/routes/_app/atividades/index.tsx` (manter listagem, ajustar colunas)

Identidade visual mantida: azul primário, lilás/amarelo/cinza de apoio, fundo claro, tabelas limpas, responsivo. Tudo em pt-BR.
