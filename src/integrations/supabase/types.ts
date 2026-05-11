export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atendido_documentos: {
        Row: {
          atendido_id: string
          created_at: string
          id: string
          nome: string
          tipo: string | null
          url: string
        }
        Insert: {
          atendido_id: string
          created_at?: string
          id?: string
          nome: string
          tipo?: string | null
          url: string
        }
        Update: {
          atendido_id?: string
          created_at?: string
          id?: string
          nome?: string
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendido_documentos_atendido_id_fkey"
            columns: ["atendido_id"]
            isOneToOne: false
            referencedRelation: "atendidos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendido_marcadores: {
        Row: {
          atendido_id: string
          created_at: string
          id: string
          marcador: string
        }
        Insert: {
          atendido_id: string
          created_at?: string
          id?: string
          marcador: string
        }
        Update: {
          atendido_id?: string
          created_at?: string
          id?: string
          marcador?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendido_marcadores_atendido_id_fkey"
            columns: ["atendido_id"]
            isOneToOne: false
            referencedRelation: "atendidos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendido_projetos: {
        Row: {
          atendido_id: string
          atividade_id: string | null
          created_at: string
          data_entrada: string | null
          grupo_id: string | null
          id: string
          projeto_id: string | null
          responsavel_id: string | null
          status: string | null
        }
        Insert: {
          atendido_id: string
          atividade_id?: string | null
          created_at?: string
          data_entrada?: string | null
          grupo_id?: string | null
          id?: string
          projeto_id?: string | null
          responsavel_id?: string | null
          status?: string | null
        }
        Update: {
          atendido_id?: string
          atividade_id?: string | null
          created_at?: string
          data_entrada?: string | null
          grupo_id?: string | null
          id?: string
          projeto_id?: string | null
          responsavel_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendido_projetos_atendido_id_fkey"
            columns: ["atendido_id"]
            isOneToOne: false
            referencedRelation: "atendidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendido_projetos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendido_projetos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendido_projetos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendidos: {
        Row: {
          aceite_participacao: boolean | null
          autorizacao_imagem: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          comunicacao_alternativa: boolean | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          demanda_inicial: string | null
          email: string | null
          encaminhamento: string | null
          endereco: string | null
          escolaridade: string | null
          foto_url: string | null
          genero: string | null
          id: string
          id_externo: string | null
          idade_importada: number | null
          matricula: string
          matricula_familia: string | null
          mobilidade_reduzida: boolean | null
          necessidade_apoio: string | null
          nome: string
          numero_pessoas_familia: number | null
          observacoes: string | null
          observacoes_acessibilidade: string | null
          observacoes_familiares: string | null
          observacoes_legais: string | null
          pessoa_com_deficiencia: string | null
          proximo_retorno: string | null
          responsavel_email: string | null
          responsavel_nome: string | null
          responsavel_parentesco: string | null
          responsavel_telefone: string | null
          restricao_saude: string | null
          rg: string | null
          status: string
          telefone: string | null
          tipo_deficiencia: string | null
          updated_at: string
          usa_cadeira_rodas: boolean | null
          whatsapp: string | null
        }
        Insert: {
          aceite_participacao?: boolean | null
          autorizacao_imagem?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          comunicacao_alternativa?: boolean | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          demanda_inicial?: string | null
          email?: string | null
          encaminhamento?: string | null
          endereco?: string | null
          escolaridade?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: string
          id_externo?: string | null
          idade_importada?: number | null
          matricula?: string
          matricula_familia?: string | null
          mobilidade_reduzida?: boolean | null
          necessidade_apoio?: string | null
          nome: string
          numero_pessoas_familia?: number | null
          observacoes?: string | null
          observacoes_acessibilidade?: string | null
          observacoes_familiares?: string | null
          observacoes_legais?: string | null
          pessoa_com_deficiencia?: string | null
          proximo_retorno?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_parentesco?: string | null
          responsavel_telefone?: string | null
          restricao_saude?: string | null
          rg?: string | null
          status?: string
          telefone?: string | null
          tipo_deficiencia?: string | null
          updated_at?: string
          usa_cadeira_rodas?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          aceite_participacao?: boolean | null
          autorizacao_imagem?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          comunicacao_alternativa?: boolean | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          demanda_inicial?: string | null
          email?: string | null
          encaminhamento?: string | null
          endereco?: string | null
          escolaridade?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: string
          id_externo?: string | null
          idade_importada?: number | null
          matricula?: string
          matricula_familia?: string | null
          mobilidade_reduzida?: boolean | null
          necessidade_apoio?: string | null
          nome?: string
          numero_pessoas_familia?: number | null
          observacoes?: string | null
          observacoes_acessibilidade?: string | null
          observacoes_familiares?: string | null
          observacoes_legais?: string | null
          pessoa_com_deficiencia?: string | null
          proximo_retorno?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_parentesco?: string | null
          responsavel_telefone?: string | null
          restricao_saude?: string | null
          rg?: string | null
          status?: string
          telefone?: string | null
          tipo_deficiencia?: string | null
          updated_at?: string
          usa_cadeira_rodas?: boolean | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      atendimentos: {
        Row: {
          contato_id: string | null
          created_at: string
          data: string
          demanda: string | null
          encaminhamento: string | null
          id: string
          nome_atendido: string
          observacoes: string | null
          responsavel_id: string | null
          retorno: string | null
          status: string
          tipo: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          data?: string
          demanda?: string | null
          encaminhamento?: string | null
          id?: string
          nome_atendido: string
          observacoes?: string | null
          responsavel_id?: string | null
          retorno?: string | null
          status?: string
          tipo?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          data?: string
          demanda?: string | null
          encaminhamento?: string | null
          id?: string
          nome_atendido?: string
          observacoes?: string | null
          responsavel_id?: string | null
          retorno?: string | null
          status?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      atividade_educadores: {
        Row: {
          atividade_id: string
          created_at: string
          id: string
          usuario_id: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          id?: string
          usuario_id: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      atividade_fotos: {
        Row: {
          atividade_id: string
          created_at: string
          data_foto: string | null
          encontro_id: string | null
          id: string
          legenda: string | null
          ordem: number | null
          tipo_foto: string
          url: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          data_foto?: string | null
          encontro_id?: string | null
          id?: string
          legenda?: string | null
          ordem?: number | null
          tipo_foto?: string
          url: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          data_foto?: string | null
          encontro_id?: string | null
          id?: string
          legenda?: string | null
          ordem?: number | null
          tipo_foto?: string
          url?: string
        }
        Relationships: []
      }
      atividade_gestores: {
        Row: {
          atividade_id: string
          created_at: string
          id: string
          usuario_id: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          id?: string
          usuario_id: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      atividade_inscritos: {
        Row: {
          atendido_id: string
          atividade_id: string
          created_at: string
          data_inscricao: string
          id: string
          observacoes: string | null
          status: string
        }
        Insert: {
          atendido_id: string
          atividade_id: string
          created_at?: string
          data_inscricao?: string
          id?: string
          observacoes?: string | null
          status?: string
        }
        Update: {
          atendido_id?: string
          atividade_id?: string
          created_at?: string
          data_inscricao?: string
          id?: string
          observacoes?: string | null
          status?: string
        }
        Relationships: []
      }
      atividades: {
        Row: {
          carga_horaria_horas: number | null
          carga_horaria_minutos: number | null
          controle_presenca: boolean
          created_at: string
          data: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          facilitador_id: string | null
          formato_execucao: string
          foto_capa_legenda: string | null
          foto_capa_url: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          local: string | null
          media_final_conceito: boolean
          numero_vagas: number | null
          objetivo_relacionado: string | null
          observacoes: string | null
          participantes_atendidos: number | null
          participantes_previstos: number | null
          periodo_matutino: boolean
          periodo_noturno: boolean
          periodo_vespertino: boolean
          permite_ultrapassar_limite: boolean
          projeto_id: string | null
          quem_pode_participar: string | null
          resultado_esperado: string | null
          status: string
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          carga_horaria_horas?: number | null
          carga_horaria_minutos?: number | null
          controle_presenca?: boolean
          created_at?: string
          data?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          facilitador_id?: string | null
          formato_execucao?: string
          foto_capa_legenda?: string | null
          foto_capa_url?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          media_final_conceito?: boolean
          numero_vagas?: number | null
          objetivo_relacionado?: string | null
          observacoes?: string | null
          participantes_atendidos?: number | null
          participantes_previstos?: number | null
          periodo_matutino?: boolean
          periodo_noturno?: boolean
          periodo_vespertino?: boolean
          permite_ultrapassar_limite?: boolean
          projeto_id?: string | null
          quem_pode_participar?: string | null
          resultado_esperado?: string | null
          status?: string
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          carga_horaria_horas?: number | null
          carga_horaria_minutos?: number | null
          controle_presenca?: boolean
          created_at?: string
          data?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          facilitador_id?: string | null
          formato_execucao?: string
          foto_capa_legenda?: string | null
          foto_capa_url?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          media_final_conceito?: boolean
          numero_vagas?: number | null
          objetivo_relacionado?: string | null
          observacoes?: string | null
          participantes_atendidos?: number | null
          participantes_previstos?: number | null
          periodo_matutino?: boolean
          periodo_noturno?: boolean
          periodo_vespertino?: boolean
          permite_ultrapassar_limite?: boolean
          projeto_id?: string | null
          quem_pode_participar?: string | null
          resultado_esperado?: string | null
          status?: string
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos: {
        Row: {
          cidade: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          organizacao: string | null
          tags: string | null
          telefone: string | null
          tipo: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organizacao?: string | null
          tags?: string | null
          telefone?: string | null
          tipo?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organizacao?: string | null
          tags?: string | null
          telefone?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          created_at: string
          entidade_id: string
          entidade_tipo: string
          id: string
          nome: string
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          entidade_id: string
          entidade_tipo: string
          id?: string
          nome: string
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          nome?: string
          tipo?: string | null
          url?: string
        }
        Relationships: []
      }
      editais: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          documentos_necessarios: string | null
          id: string
          link: string | null
          observacoes: string | null
          organizacao: string | null
          requisitos: string | null
          status: string
          titulo: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          documentos_necessarios?: string | null
          id?: string
          link?: string | null
          observacoes?: string | null
          organizacao?: string | null
          requisitos?: string | null
          status?: string
          titulo: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          documentos_necessarios?: string | null
          id?: string
          link?: string | null
          observacoes?: string | null
          organizacao?: string | null
          requisitos?: string | null
          status?: string
          titulo?: string
          valor?: number | null
        }
        Relationships: []
      }
      encontros_atividade: {
        Row: {
          atividade_id: string
          created_at: string
          data: string
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          numero_presentes: number | null
          observacoes: string | null
          periodo: string | null
          resumo: string | null
          status: string
          updated_at: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          data: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          numero_presentes?: number | null
          observacoes?: string | null
          periodo?: string | null
          resumo?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          data?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          numero_presentes?: number | null
          observacoes?: string | null
          periodo?: string | null
          resumo?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fechamentos_mensais: {
        Row: {
          ano: number
          atividade_id: string
          created_at: string
          data_fechamento: string | null
          depoimentos: string | null
          dificuldades: string | null
          encaminhamentos: string | null
          id: string
          mes: number
          quantidade_encontros: number | null
          responsavel_id: string | null
          resultados: string | null
          resumo_realizado: string | null
          situacao: string
          total_atendidos: number | null
        }
        Insert: {
          ano: number
          atividade_id: string
          created_at?: string
          data_fechamento?: string | null
          depoimentos?: string | null
          dificuldades?: string | null
          encaminhamentos?: string | null
          id?: string
          mes: number
          quantidade_encontros?: number | null
          responsavel_id?: string | null
          resultados?: string | null
          resumo_realizado?: string | null
          situacao?: string
          total_atendidos?: number | null
        }
        Update: {
          ano?: number
          atividade_id?: string
          created_at?: string
          data_fechamento?: string | null
          depoimentos?: string | null
          dificuldades?: string | null
          encaminhamentos?: string | null
          id?: string
          mes?: number
          quantidade_encontros?: number | null
          responsavel_id?: string | null
          resultados?: string | null
          resumo_realizado?: string | null
          situacao?: string
          total_atendidos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_mensais_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          ano: number | null
          atividade_id: string
          created_at: string
          data_foto: string | null
          id: string
          legenda: string | null
          mes: number | null
          url: string
        }
        Insert: {
          ano?: number | null
          atividade_id: string
          created_at?: string
          data_foto?: string | null
          id?: string
          legenda?: string | null
          mes?: number | null
          url: string
        }
        Update: {
          ano?: number | null
          atividade_id?: string
          created_at?: string
          data_foto?: string | null
          id?: string
          legenda?: string | null
          mes?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          cidade: string | null
          contato_principal: string | null
          created_at: string
          dia_horario: string | null
          facilitador_id: string | null
          id: string
          local: string | null
          nome: string
          observacoes: string | null
          projeto_id: string | null
          territorio: string | null
        }
        Insert: {
          cidade?: string | null
          contato_principal?: string | null
          created_at?: string
          dia_horario?: string | null
          facilitador_id?: string | null
          id?: string
          local?: string | null
          nome: string
          observacoes?: string | null
          projeto_id?: string | null
          territorio?: string | null
        }
        Update: {
          cidade?: string | null
          contato_principal?: string | null
          created_at?: string
          dia_horario?: string | null
          facilitador_id?: string | null
          id?: string
          local?: string | null
          nome?: string
          observacoes?: string | null
          projeto_id?: string | null
          territorio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_atendimentos: {
        Row: {
          atendido_id: string
          created_at: string
          data: string
          demanda: string | null
          encaminhamento: string | null
          id: string
          observacoes: string | null
          responsavel_id: string | null
          tipo: string | null
        }
        Insert: {
          atendido_id: string
          created_at?: string
          data?: string
          demanda?: string | null
          encaminhamento?: string | null
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          tipo?: string | null
        }
        Update: {
          atendido_id?: string
          created_at?: string
          data?: string
          demanda?: string | null
          encaminhamento?: string | null
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_atendimentos_atendido_id_fkey"
            columns: ["atendido_id"]
            isOneToOne: false
            referencedRelation: "atendidos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_mensais: {
        Row: {
          ano: number
          atividade_id: string
          created_at: string
          id: string
          mes: number
          plano: string | null
          responsavel_id: string | null
          updated_at: string
        }
        Insert: {
          ano: number
          atividade_id: string
          created_at?: string
          id?: string
          mes: number
          plano?: string | null
          responsavel_id?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number
          atividade_id?: string
          created_at?: string
          id?: string
          mes?: number
          plano?: string | null
          responsavel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_mensais_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          atividade_id: string
          contato_id: string | null
          created_at: string
          id: string
          nome_participante: string | null
          observacao: string | null
          presente: boolean
        }
        Insert: {
          atividade_id: string
          contato_id?: string | null
          created_at?: string
          id?: string
          nome_participante?: string | null
          observacao?: string | null
          presente?: boolean
        }
        Update: {
          atividade_id?: string
          contato_id?: string | null
          created_at?: string
          id?: string
          nome_participante?: string | null
          observacao?: string | null
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "presencas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas_atividade: {
        Row: {
          atendido_id: string
          created_at: string
          encontro_id: string
          id: string
          observacao: string | null
          presente: boolean
        }
        Insert: {
          atendido_id: string
          created_at?: string
          encontro_id: string
          id?: string
          observacao?: string | null
          presente?: boolean
        }
        Update: {
          atendido_id?: string
          created_at?: string
          encontro_id?: string
          id?: string
          observacao?: string | null
          presente?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      projeto_cronograma: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          etapa: string
          id: string
          observacoes: string | null
          projeto_id: string
          responsavel: string | null
          status: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          etapa: string
          id?: string
          observacoes?: string | null
          projeto_id: string
          responsavel?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          etapa?: string
          id?: string
          observacoes?: string | null
          projeto_id?: string
          responsavel?: string | null
          status?: string
        }
        Relationships: []
      }
      projeto_documentos: {
        Row: {
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          projeto_id: string
          responsavel: string | null
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          projeto_id: string
          responsavel?: string | null
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          projeto_id?: string
          responsavel?: string | null
          tipo?: string | null
          url?: string
        }
        Relationships: []
      }
      projeto_fotos: {
        Row: {
          atividade_id: string | null
          created_at: string
          data_foto: string | null
          id: string
          legenda: string | null
          ordem: number | null
          projeto_id: string
          tipo: string | null
          url: string
        }
        Insert: {
          atividade_id?: string | null
          created_at?: string
          data_foto?: string | null
          id?: string
          legenda?: string | null
          ordem?: number | null
          projeto_id: string
          tipo?: string | null
          url: string
        }
        Update: {
          atividade_id?: string | null
          created_at?: string
          data_foto?: string | null
          id?: string
          legenda?: string | null
          ordem?: number | null
          projeto_id?: string
          tipo?: string | null
          url?: string
        }
        Relationships: []
      }
      projeto_metas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          observacoes: string | null
          projeto_id: string
          quantidade_prevista: number | null
          quantidade_realizada: number | null
          status: string
          unidade_medida: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          projeto_id: string
          quantidade_prevista?: number | null
          quantidade_realizada?: number | null
          status?: string
          unidade_medida?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          projeto_id?: string
          quantidade_prevista?: number | null
          quantidade_realizada?: number | null
          status?: string
          unidade_medida?: string | null
        }
        Relationships: []
      }
      projeto_orcamento: {
        Row: {
          categoria: string | null
          comprovante_url: string | null
          created_at: string
          data_despesa: string | null
          descricao: string | null
          fornecedor: string | null
          id: string
          observacoes: string | null
          projeto_id: string
          valor_executado: number | null
          valor_previsto: number | null
        }
        Insert: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_despesa?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          projeto_id: string
          valor_executado?: number | null
          valor_previsto?: number | null
        }
        Update: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_despesa?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          projeto_id?: string
          valor_executado?: number | null
          valor_previsto?: number | null
        }
        Relationships: []
      }
      projetos: {
        Row: {
          arquivado: boolean | null
          atendidos_previstos: number | null
          atendidos_realizados: number | null
          cidade: string | null
          contrapartida: number | null
          coordenador_id: string | null
          coordenador_nome: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          data_limite_prestacao: string | null
          descricao: string | null
          edital_id: string | null
          edital_nome: string | null
          fonte_recurso: string | null
          id: string
          id_externo: string | null
          impacto_social: string | null
          indicadores: string | null
          justificativa: string | null
          lei_incentivo: boolean | null
          local_execucao: string | null
          metas: string | null
          metodologia: string | null
          numero_processo: string | null
          numero_projeto: string | null
          numero_termo: string | null
          objetivo_geral: string | null
          objetivos_especificos: string | null
          obs_captacao: string | null
          orcamento_previsto: number | null
          orgao_edital: string | null
          parceiro: string | null
          patrocinador: string | null
          publico_alvo: string | null
          qual_lei_incentivo: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          resultados_esperados: string | null
          situacao_prestacao_contas: string | null
          status: string
          territorio: string | null
          tipo: string | null
          titulo: string
          updated_at: string
          valor_aprovado: number | null
          valor_captado: number | null
          valor_executado: number | null
          valor_solicitado: number | null
        }
        Insert: {
          arquivado?: boolean | null
          atendidos_previstos?: number | null
          atendidos_realizados?: number | null
          cidade?: string | null
          contrapartida?: number | null
          coordenador_id?: string | null
          coordenador_nome?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          data_limite_prestacao?: string | null
          descricao?: string | null
          edital_id?: string | null
          edital_nome?: string | null
          fonte_recurso?: string | null
          id?: string
          id_externo?: string | null
          impacto_social?: string | null
          indicadores?: string | null
          justificativa?: string | null
          lei_incentivo?: boolean | null
          local_execucao?: string | null
          metas?: string | null
          metodologia?: string | null
          numero_processo?: string | null
          numero_projeto?: string | null
          numero_termo?: string | null
          objetivo_geral?: string | null
          objetivos_especificos?: string | null
          obs_captacao?: string | null
          orcamento_previsto?: number | null
          orgao_edital?: string | null
          parceiro?: string | null
          patrocinador?: string | null
          publico_alvo?: string | null
          qual_lei_incentivo?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          resultados_esperados?: string | null
          situacao_prestacao_contas?: string | null
          status?: string
          territorio?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          valor_aprovado?: number | null
          valor_captado?: number | null
          valor_executado?: number | null
          valor_solicitado?: number | null
        }
        Update: {
          arquivado?: boolean | null
          atendidos_previstos?: number | null
          atendidos_realizados?: number | null
          cidade?: string | null
          contrapartida?: number | null
          coordenador_id?: string | null
          coordenador_nome?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          data_limite_prestacao?: string | null
          descricao?: string | null
          edital_id?: string | null
          edital_nome?: string | null
          fonte_recurso?: string | null
          id?: string
          id_externo?: string | null
          impacto_social?: string | null
          indicadores?: string | null
          justificativa?: string | null
          lei_incentivo?: boolean | null
          local_execucao?: string | null
          metas?: string | null
          metodologia?: string | null
          numero_processo?: string | null
          numero_projeto?: string | null
          numero_termo?: string | null
          objetivo_geral?: string | null
          objetivos_especificos?: string | null
          obs_captacao?: string | null
          orcamento_previsto?: number | null
          orgao_edital?: string | null
          parceiro?: string | null
          patrocinador?: string | null
          publico_alvo?: string | null
          qual_lei_incentivo?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          resultados_esperados?: string | null
          situacao_prestacao_contas?: string | null
          status?: string
          territorio?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          valor_aprovado?: number | null
          valor_captado?: number | null
          valor_executado?: number | null
          valor_solicitado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_edital_id_fkey"
            columns: ["edital_id"]
            isOneToOne: false
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_coord: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "administrador" | "coordenador" | "colaborador" | "consulta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["administrador", "coordenador", "colaborador", "consulta"],
    },
  },
} as const
