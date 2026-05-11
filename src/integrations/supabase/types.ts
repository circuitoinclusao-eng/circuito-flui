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
      atividades: {
        Row: {
          created_at: string
          data: string | null
          facilitador_id: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          local: string | null
          observacoes: string | null
          participantes_atendidos: number | null
          participantes_previstos: number | null
          projeto_id: string | null
          status: string
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          data?: string | null
          facilitador_id?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          observacoes?: string | null
          participantes_atendidos?: number | null
          participantes_previstos?: number | null
          projeto_id?: string | null
          status?: string
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          data?: string | null
          facilitador_id?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          observacoes?: string | null
          participantes_atendidos?: number | null
          participantes_previstos?: number | null
          projeto_id?: string | null
          status?: string
          tipo?: string | null
          titulo?: string
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
      projetos: {
        Row: {
          cidade: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          edital_id: string | null
          id: string
          indicadores: string | null
          metas: string | null
          numero_projeto: string | null
          objetivo_geral: string | null
          objetivos_especificos: string | null
          orcamento_previsto: number | null
          publico_alvo: string | null
          responsavel_id: string | null
          status: string
          territorio: string | null
          titulo: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          edital_id?: string | null
          id?: string
          indicadores?: string | null
          metas?: string | null
          numero_projeto?: string | null
          objetivo_geral?: string | null
          objetivos_especificos?: string | null
          orcamento_previsto?: number | null
          publico_alvo?: string | null
          responsavel_id?: string | null
          status?: string
          territorio?: string | null
          titulo: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          edital_id?: string | null
          id?: string
          indicadores?: string | null
          metas?: string | null
          numero_projeto?: string | null
          objetivo_geral?: string | null
          objetivos_especificos?: string | null
          orcamento_previsto?: number | null
          publico_alvo?: string | null
          responsavel_id?: string | null
          status?: string
          territorio?: string | null
          titulo?: string
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
