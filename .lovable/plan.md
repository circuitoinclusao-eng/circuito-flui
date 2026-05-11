## Plano: Módulo Projetos completo

Vou expandir o módulo **Projetos** seguindo o mesmo padrão do módulo Atendidos: listagem rica, ficha em abas, importação por planilha com detecção automática de cabeçalho, tabelas relacionadas (metas, cronograma, orçamento, documentos, fotos), e relatórios.

### Escopo MVP (primeira entrega)

Para evitar uma entrega monolítica difícil de revisar, vou dividir em **2 fases**. Esta primeira fase entrega o núcleo funcional; a segunda fase (relatórios, dashboards e prestação de contas avançada) virá depois mediante sua confirmação.

### Fase 1 — Núcleo do módulo

#### 1. Banco de dados (1 migration)

Ampliar `projetos` adicionando:
- `id_externo`, `numero_projeto` (já existe), `tipo`, `local_execucao`
- `atendidos_previstos`, `atendidos_realizados`
- `responsavel_nome`, `coordenador_id`, `coordenador_nome`
- `edital_nome`, `orgao_edital`, `fonte_recurso`, `lei_incentivo` (bool), `qual_lei_incentivo`, `numero_processo`, `numero_termo`, `patrocinador`, `parceiro`
- `valor_solicitado`, `valor_aprovado` (existe como `orcamento_previsto` — manter ambos), `valor_captado`, `valor_executado`, `contrapartida`, `obs_captacao`
- `justificativa`, `metodologia`, `resultados_esperados`, `impacto_social`
- `situacao_prestacao_contas`, `data_limite_prestacao`, `arquivado` (bool)
- `updated_at` + trigger

Criar tabelas com RLS (mesmas policies dos demais — view=true, ins/upd=can_edit, del=is_admin_or_coord):
- `projeto_metas` (nome, descricao, qtd_prevista, qtd_realizada, unidade, status, observacoes)
- `projeto_cronograma` (etapa, descricao, data_inicio, data_fim, responsavel, status, observacoes)
- `projeto_orcamento` (categoria, descricao, valor_previsto, valor_executado, data_despesa, fornecedor, comprovante_url, observacoes)
- `projeto_documentos` (nome, tipo, url, responsavel, observacoes)
- `projeto_fotos` (atividade_id, url, legenda, data_foto, tipo, ordem)

Índice único parcial em `id_externo` e `numero_projeto` para upsert.

#### 2. Helpers e constantes

Novo `src/lib/projetos.ts`:
- Constantes: `PROJETO_STATUS` (13 status), `META_STATUS`, `CRONOGRAMA_STATUS`, `PRESTACAO_STATUS`, `CATEGORIAS_ORCAMENTO`, `TIPOS_DOCUMENTO`
- Helpers: `statusLabel`, `statusClass`, `formatCurrency`

#### 3. Listagem `/projetos`

Reescrever com:
- Breadcrumb, busca livre, botões: Novo projeto, Importar planilha, Gerar arquivo (CSV), Filtros
- Tabela: Nome, Nº, Status, Edital, Cidade, Responsável, Início, Fim, Valor aprovado, Valor executado, Atividades (count), Atendidos (count), Prestação de contas, Ações
- Mobile: cards
- Filtros: status, cidade, edital, responsável, período, prestação de contas, "sem atividade"
- Ações por linha: Detalhes, Editar, Duplicar, Arquivar, Excluir (com confirm)

#### 4. Cadastro/Edição `/projetos/novo` e `/projetos/$id/editar`

Form único reutilizável `ProjetoForm.tsx` com **5 blocos colapsáveis**:
1. Dados principais
2. Edital / Fonte de recurso
3. Objetivos e metodologia
4. Captação financeira (valores)
5. Prestação de contas

Apenas **nome** é obrigatório.

#### 5. Ficha `/projetos/$id`

Cabeçalho com nome, nº, status, cidade, responsável, período, valor aprovado + botões (Editar, Nova atividade, Adicionar atendido, Gerar arquivo, Arquivar).

Cards de resumo: Total atendidos, Total atividades, Encontros realizados, Frequência média, Valor aprovado, Valor executado, Saldo, Metas cumpridas.

**Abas (Tabs):**
- Visão geral
- Atividades (lista filtrada por `projeto_id`)
- Atendidos (de `atendido_projetos`)
- Metas (CRUD inline)
- Cronograma (CRUD inline)
- Orçamento (CRUD inline + resumo)
- Documentos (upload para bucket `documentos`)
- Fotos (galeria + upload)
- Prestação de contas

Botão "Gerar arquivo": dropdown com CSV de atendidos, CSV financeiro, página imprimível.

#### 6. Importação `ImportarProjetosDialog.tsx`

Reaproveitando a lógica do dialog de Atendidos:
- XLS/XLSX/CSV/TSV via SheetJS
- Detecção automática da linha de cabeçalho (ignora "Projetos", "Dados do projeto" etc.)
- ALIAS map para todas as variações listadas
- Upsert por `id_externo` ou `numero_projeto`
- Prévia com 10 linhas, contadores (linhas, válidos, com ID, sem nome)
- Botão "Baixar modelo" gera XLSX com colunas exemplares

### Fase 2 (depois, mediante confirmação)

- Submenus: Propostas, Em execução, Finalizados, Prestação de contas (filtros pré-aplicados)
- Tela "Dados incompletos dos projetos"
- Relatórios com gráficos (barras, pizza, linha do tempo)
- `projeto_relatorios` armazenando relatórios gerados

### Arquivos novos
- `supabase/migrations/<ts>_projetos_modulo_completo.sql`
- `src/lib/projetos.ts`
- `src/components/projetos/ProjetoForm.tsx`
- `src/components/projetos/ImportarProjetosDialog.tsx`
- `src/components/projetos/MetasTab.tsx`
- `src/components/projetos/CronogramaTab.tsx`
- `src/components/projetos/OrcamentoTab.tsx`
- `src/components/projetos/DocumentosTab.tsx`
- `src/components/projetos/FotosTab.tsx`

### Arquivos editados
- `src/routes/_app/projetos/index.tsx`
- `src/routes/_app/projetos/novo.tsx`
- `src/routes/_app/projetos/$id/editar.tsx`
- `src/routes/_app/projetos/$id/index.tsx`
- `src/components/AppLayout.tsx` (adicionar item "Importar planilha" no submenu de Projetos, se aplicável)

Identidade visual mantida: azul primário, lilás/amarelo de apoio, fundo claro, tabelas limpas, responsivo, pt-BR.

Confirma esse plano para Fase 1? Posso iniciar a migration e construção em seguida.