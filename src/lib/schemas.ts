import type { Field } from "@/components/Resource";

export const projetoStatus = [
  { value: "rascunho", label: "Rascunho" },
  { value: "em_analise", label: "Em análise" },
  { value: "aprovado", label: "Aprovado" },
  { value: "em_execucao", label: "Em execução" },
  { value: "finalizado", label: "Finalizado" },
  { value: "prestacao_contas", label: "Prestação de contas" },
];

export const editalStatus = [
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "enviado", label: "Enviado" },
  { value: "aprovado", label: "Aprovado" },
  { value: "reprovado", label: "Reprovado" },
  { value: "encerrado", label: "Encerrado" },
];

export const atendimentoTipo = [
  { value: "individual", label: "Individual" },
  { value: "familiar", label: "Familiar" },
  { value: "institucional", label: "Institucional" },
  { value: "parceiro", label: "Parceiro" },
  { value: "voluntario", label: "Voluntário" },
];

export const atendimentoStatus = [
  { value: "aberto", label: "Aberto" },
  { value: "resolvido", label: "Resolvido" },
  { value: "pendente", label: "Pendente" },
  { value: "acompanhamento", label: "Acompanhamento" },
];

export const atividadeStatus = [
  { value: "planejada", label: "Planejada" },
  { value: "realizada", label: "Realizada" },
  { value: "cancelada", label: "Cancelada" },
];

export const contatoTipo = [
  { value: "participante", label: "Participante" },
  { value: "familia", label: "Família" },
  { value: "parceiro", label: "Parceiro" },
  { value: "patrocinador", label: "Patrocinador" },
  { value: "empresa", label: "Empresa" },
  { value: "poder_publico", label: "Poder público" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "voluntario", label: "Voluntário" },
];

export const editalFields: Field[] = [
  { name: "titulo", label: "Nome do edital", required: true, full: true },
  { name: "organizacao", label: "Organização responsável" },
  { name: "link", label: "Link do edital" },
  { name: "valor", label: "Valor disponível (R$)", type: "number" },
  { name: "data_inicio", label: "Data de abertura", type: "date" },
  { name: "data_fim", label: "Data de encerramento", type: "date" },
  { name: "status", label: "Status", type: "select", options: editalStatus, required: true },
  { name: "requisitos", label: "Requisitos", type: "textarea" },
  { name: "documentos_necessarios", label: "Documentos necessários", type: "textarea" },
  { name: "observacoes", label: "Observações", type: "textarea" },
];

export const projetoFields: Field[] = [
  { name: "titulo", label: "Nome do projeto", required: true, full: true },
  { name: "numero_projeto", label: "Número do projeto" },
  { name: "status", label: "Status", type: "select", options: projetoStatus, required: true },
  { name: "cidade", label: "Cidade" },
  { name: "territorio", label: "Território" },
  { name: "publico_alvo", label: "Público atendido" },
  { name: "data_inicio", label: "Data de início", type: "date" },
  { name: "data_fim", label: "Data de término", type: "date" },
  { name: "orcamento_previsto", label: "Orçamento previsto (R$)", type: "number" },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "objetivo_geral", label: "Objetivo geral", type: "textarea" },
  { name: "objetivos_especificos", label: "Objetivos específicos", type: "textarea" },
  { name: "metas", label: "Metas", type: "textarea" },
  { name: "indicadores", label: "Indicadores", type: "textarea" },
];

export const atividadeFields: Field[] = [
  { name: "titulo", label: "Nome da atividade", required: true, full: true },
  { name: "tipo", label: "Tipo de atividade" },
  { name: "data", label: "Data", type: "date" },
  { name: "horario_inicio", label: "Horário início", type: "time" },
  { name: "horario_fim", label: "Horário fim", type: "time" },
  { name: "local", label: "Local" },
  { name: "status", label: "Status", type: "select", options: atividadeStatus, required: true },
  { name: "participantes_previstos", label: "Quantidade prevista", type: "number" },
  { name: "participantes_atendidos", label: "Quantidade realizada / atendidos", type: "number" },
  { name: "observacoes", label: "Observações", type: "textarea" },
];

export const atendimentoFields: Field[] = [
  { name: "nome_atendido", label: "Nome da pessoa ou organização", required: true, full: true },
  { name: "tipo", label: "Tipo", type: "select", options: atendimentoTipo },
  { name: "data", label: "Data", type: "date", required: true },
  { name: "status", label: "Status", type: "select", options: atendimentoStatus, required: true },
  { name: "demanda", label: "Demanda apresentada", type: "textarea" },
  { name: "encaminhamento", label: "Encaminhamento realizado", type: "textarea" },
  { name: "retorno", label: "Retorno necessário", type: "textarea" },
  { name: "observacoes", label: "Observações", type: "textarea" },
];

export const grupoFields: Field[] = [
  { name: "nome", label: "Nome do grupo / turma", required: true, full: true },
  { name: "cidade", label: "Cidade" },
  { name: "territorio", label: "Território" },
  { name: "local", label: "Local das atividades" },
  { name: "dia_horario", label: "Dia e horário" },
  { name: "contato_principal", label: "Contato principal" },
  { name: "observacoes", label: "Observações", type: "textarea" },
];

export const contatoFields: Field[] = [
  { name: "nome", label: "Nome", required: true, full: true },
  { name: "tipo", label: "Tipo", type: "select", options: contatoTipo },
  { name: "telefone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "organizacao", label: "Organização" },
  { name: "cidade", label: "Cidade" },
  { name: "tags", label: "Tags (separadas por vírgula)" },
  { name: "observacoes", label: "Observações", type: "textarea" },
];
