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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      acessos_cartorio: {
        Row: {
          ativo: boolean
          cartorio_id: string
          data_criacao: string
          data_expiracao: string
          email_contato: string | null
          id: string
          login_token: string
        }
        Insert: {
          ativo?: boolean
          cartorio_id: string
          data_criacao?: string
          data_expiracao: string
          email_contato?: string | null
          id?: string
          login_token: string
        }
        Update: {
          ativo?: boolean
          cartorio_id?: string
          data_criacao?: string
          data_expiracao?: string
          email_contato?: string | null
          id?: string
          login_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "acessos_cartorio_fk"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          email: string
          id: string
          nome: string | null
        }
        Insert: {
          email: string
          id: string
          nome?: string | null
        }
        Update: {
          email?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      cartorio_acesso_conteudo: {
        Row: {
          ativo: boolean
          cartorio_id: string
          data_liberacao: string
          id: string
          nivel_acesso: string | null
          produto_id: string | null
          sistema_id: string | null
        }
        Insert: {
          ativo?: boolean
          cartorio_id: string
          data_liberacao?: string
          id?: string
          nivel_acesso?: string | null
          produto_id?: string | null
          sistema_id?: string | null
        }
        Update: {
          ativo?: boolean
          cartorio_id?: string
          data_liberacao?: string
          id?: string
          nivel_acesso?: string | null
          produto_id?: string | null
          sistema_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cartorio_acesso_conteudo_cartorio_id_fkey"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartorio_acesso_conteudo_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartorio_acesso_conteudo_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      cartorio_sessions: {
        Row: {
          cartorio_id: string
          created_at: string
          id: string
          is_active: boolean
          last_activity: string
        }
        Insert: {
          cartorio_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
        }
        Update: {
          cartorio_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartorio_sessions_cartorio_id_fkey"
            columns: ["cartorio_id"]
            isOneToOne: true
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
        ]
      }
      cartorio_usuarios: {
        Row: {
          active_trilha_id: string | null
          auth_user_id: string | null
          cartorio_id: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          active_trilha_id?: string | null
          auth_user_id?: string | null
          cartorio_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          active_trilha_id?: string | null
          auth_user_id?: string | null
          cartorio_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartorio_usuarios_active_trilha_id_fkey"
            columns: ["active_trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartorio_usuarios_fk"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
        ]
      }
      cartorios: {
        Row: {
          cidade: string | null
          data_cadastro: string
          email: string | null
          estado: string | null
          id: string
          is_active: boolean | null
          nome: string
          observacoes: string | null
        }
        Insert: {
          cidade?: string | null
          data_cadastro?: string
          email?: string | null
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          observacoes?: string | null
        }
        Update: {
          cidade?: string | null
          data_cadastro?: string
          email?: string | null
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          observacoes?: string | null
        }
        Relationships: []
      }
      favoritos_cartorio: {
        Row: {
          cartorio_id: string
          data_favoritado: string
          id: string
          video_aula_id: string
        }
        Insert: {
          cartorio_id: string
          data_favoritado?: string
          id?: string
          video_aula_id: string
        }
        Update: {
          cartorio_id?: string
          data_favoritado?: string
          id?: string
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_cartorio_fk"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_video_aula_fk"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          descricao: string | null
          id: string
          nome: string
          ordem: number
          sistema_id: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          sistema_id: string
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          sistema_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_sistema_fk"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_perguntas: {
        Row: {
          id: string
          imagem_url: string | null
          opcoes: Json | null
          pergunta: string
          quiz_id: string
          resposta_correta: Json | null
          tipo_pergunta: string
        }
        Insert: {
          id?: string
          imagem_url?: string | null
          opcoes?: Json | null
          pergunta: string
          quiz_id: string
          resposta_correta?: Json | null
          tipo_pergunta?: string
        }
        Update: {
          id?: string
          imagem_url?: string | null
          opcoes?: Json | null
          pergunta?: string
          quiz_id?: string
          resposta_correta?: Json | null
          tipo_pergunta?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_perguntas_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          id: string
          min_acertos: number
          qtd_perguntas_exibir: number
          tipo: string
          titulo: string
          trilha_id: string | null
          video_aula_id: string | null
        }
        Insert: {
          id?: string
          min_acertos?: number
          qtd_perguntas_exibir?: number
          tipo?: string
          titulo: string
          trilha_id?: string | null
          video_aula_id?: string | null
        }
        Update: {
          id?: string
          min_acertos?: number
          qtd_perguntas_exibir?: number
          tipo?: string
          titulo?: string
          trilha_id?: string | null
          video_aula_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_video_aula_id_fkey"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      sistemas: {
        Row: {
          descricao: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      trilha_aulas: {
        Row: {
          id: string
          ordem: number
          trilha_id: string
          video_aula_id: string
        }
        Insert: {
          id?: string
          ordem?: number
          trilha_id: string
          video_aula_id: string
        }
        Update: {
          id?: string
          ordem?: number
          trilha_id?: string
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilha_aulas_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trilha_aulas_video_aula_id_fkey"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      trilhas: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          produto_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          produto_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilhas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_tentativas: {
        Row: {
          aprovado: boolean
          data_tentativa: string | null
          id: string
          quiz_id: string
          respostas_dadas: Json | null
          score: number
          trilha_id: string | null
          user_id: string
        }
        Insert: {
          aprovado?: boolean
          data_tentativa?: string | null
          id?: string
          quiz_id: string
          respostas_dadas?: Json | null
          score: number
          trilha_id?: string | null
          user_id: string
        }
        Update: {
          aprovado?: boolean
          data_tentativa?: string | null
          id?: string
          quiz_id?: string
          respostas_dadas?: Json | null
          score?: number
          trilha_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_tentativas_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_tentativas_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_tentativas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "cartorio_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trilha_progresso: {
        Row: {
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          status: string
          trilha_id: string
          user_id: string
        }
        Insert: {
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          status?: string
          trilha_id: string
          user_id: string
        }
        Update: {
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          status?: string
          trilha_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trilha_progresso_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_trilha_progresso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "cartorio_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          user_id: string | null
          video_aula_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_aula_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_aula_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "cartorio_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_video_progress_video_aula_id_fkey"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      video_aulas: {
        Row: {
          descricao: string | null
          id: string
          id_video_bunny: string | null
          ordem: number
          produto_id: string | null
          titulo: string
          transcricao_completa_texto: string | null
          url_thumbnail: string | null
          url_video: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          id_video_bunny?: string | null
          ordem?: number
          produto_id?: string | null
          titulo: string
          transcricao_completa_texto?: string | null
          url_thumbnail?: string | null
          url_video?: string
        }
        Update: {
          descricao?: string | null
          id?: string
          id_video_bunny?: string | null
          ordem?: number
          produto_id?: string | null
          titulo?: string
          transcricao_completa_texto?: string | null
          url_thumbnail?: string | null
          url_video?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_aulas_produto_fk"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      visualizacoes_cartorio: {
        Row: {
          cartorio_id: string
          completo: boolean
          concluida: boolean | null
          data_conclusao: string | null
          id: string
          user_id: string | null
          video_aula_id: string
        }
        Insert: {
          cartorio_id: string
          completo?: boolean
          concluida?: boolean | null
          data_conclusao?: string | null
          id?: string
          user_id?: string | null
          video_aula_id: string
        }
        Update: {
          cartorio_id?: string
          completo?: boolean
          concluida?: boolean | null
          data_conclusao?: string | null
          id?: string
          user_id?: string | null
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visualizacoes_cartorio_fk"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visualizacoes_video_aula_fk"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deactivate_old_sessions: { Args: never; Returns: undefined }
      debug_auth_cartorio_context: { Args: never; Returns: Json }
      debug_auth_context: { Args: never; Returns: Json }
      debug_cartorios_data: {
        Args: never
        Returns: {
          cartorio_ativo: boolean
          cartorio_id: string
          cartorio_nome: string
          tokens_ativos: number
          tokens_count: number
          tokens_expirados: number
          usuarios_count: number
        }[]
      }
      get_current_cartorio_id: { Args: never; Returns: string }
      get_current_cartorio_id_from_jwt: { Args: never; Returns: string }
      get_current_cartorio_user_id: { Args: never; Returns: string }
      get_current_cartorio_usuario_id: { Args: never; Returns: string }
      get_product_progress: {
        Args: { p_cartorio_id: string; p_produto_id: string }
        Returns: Json
      }
      get_user_progress_by_cartorio: {
        Args: { p_cartorio_id: string }
        Returns: {
          aulas_concluidas: number
          email: string
          is_active: boolean
          percentual: number
          produto_id: string
          produto_nome: string
          sistema_nome: string
          total_aulas: number
          user_id: string
          username: string
        }[]
      }
      get_user_progress_by_cartorio_with_permissions: {
        Args: { p_cartorio_id: string }
        Returns: {
          aulas_concluidas: number
          email: string
          is_active: boolean
          percentual: number
          produto_id: string
          produto_nome: string
          sistema_nome: string
          total_aulas: number
          user_id: string
          username: string
        }[]
      }
      get_user_video_progress: {
        Args: { p_video_aula_id?: string }
        Returns: {
          completed: boolean
          completed_at: string
          video_aula_id: string
        }[]
      }
      get_visualizacao_cartorio: {
        Args: { p_cartorio_id: string; p_video_aula_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      migrate_progress_data_safe: { Args: never; Returns: undefined }
      register_video_progress: {
        Args: { p_completed?: boolean; p_video_aula_id: string }
        Returns: Json
      }
      registrar_visualizacao_cartorio: {
        Args: {
          p_completo?: boolean
          p_concluida?: boolean
          p_data_conclusao?: string
          p_video_aula_id: string
        }
        Returns: Json
      }
      registrar_visualizacao_cartorio_robust: {
        Args: {
          p_completo?: boolean
          p_concluida?: boolean
          p_data_conclusao?: string
          p_video_aula_id: string
        }
        Returns: Json
      }
      set_cartorio_context: {
        Args: { p_cartorio_id: string }
        Returns: undefined
      }
      set_test_cartorio_id: {
        Args: { cartorio_id_param: string }
        Returns: undefined
      }
      test_cartorio_context: { Args: never; Returns: Json }
      test_insert_visualizacao_cartorio: {
        Args: {
          p_cartorio_id: string
          p_completo?: boolean
          p_concluida?: boolean
          p_data_conclusao?: string
          p_video_aula_id: string
        }
        Returns: Json
      }
      upsert_cartorio_session: {
        Args: { p_cartorio_id: string }
        Returns: undefined
      }
      validate_custom_jwt: { Args: { token: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
