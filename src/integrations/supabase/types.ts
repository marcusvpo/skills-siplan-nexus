export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
      cartorio_usuarios: {
        Row: {
          cartorio_id: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          user_id: string | null
          username: string
        }
        Insert: {
          cartorio_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
          username: string
        }
        Update: {
          cartorio_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
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
          estado: string | null
          id: string
          is_active: boolean | null
          nome: string
          observacoes: string | null
        }
        Insert: {
          cidade?: string | null
          data_cadastro?: string
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          observacoes?: string | null
        }
        Update: {
          cidade?: string | null
          data_cadastro?: string
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          observacoes?: string | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_order: number | null
          content: string
          created_at: string | null
          embedding: string
          id: string
          metadata: Json | null
          page_number: number | null
          product_id: string
          source_type: string
          timestamp_start: number | null
          video_lesson_id: string | null
        }
        Insert: {
          chunk_order?: number | null
          content: string
          created_at?: string | null
          embedding: string
          id?: string
          metadata?: Json | null
          page_number?: number | null
          product_id: string
          source_type: string
          timestamp_start?: number | null
          video_lesson_id?: string | null
        }
        Update: {
          chunk_order?: number | null
          content?: string
          created_at?: string | null
          embedding?: string
          id?: string
          metadata?: Json | null
          page_number?: number | null
          product_id?: string
          source_type?: string
          timestamp_start?: number | null
          video_lesson_id?: string | null
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
      knowledge_base: {
        Row: {
          chunk_index: number | null
          chunk_texto: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          produto_id: string | null
          video_aula_id: string | null
        }
        Insert: {
          chunk_index?: number | null
          chunk_texto?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          produto_id?: string | null
          video_aula_id?: string | null
        }
        Update: {
          chunk_index?: number | null
          chunk_texto?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          produto_id?: string | null
          video_aula_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_video_aula_id_fkey"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_conhecimento_base: {
        Row: {
          conteudo_completo: string | null
          created_at: string | null
          id: string
          produto_id: string | null
          titulo: string | null
          updated_at: string | null
          versao: string | null
        }
        Insert: {
          conteudo_completo?: string | null
          created_at?: string | null
          id?: string
          produto_id?: string | null
          titulo?: string | null
          updated_at?: string | null
          versao?: string | null
        }
        Update: {
          conteudo_completo?: string | null
          created_at?: string | null
          id?: string
          produto_id?: string | null
          titulo?: string | null
          updated_at?: string | null
          versao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produto_conhecimento_base_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
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
      video_embeddings: {
        Row: {
          chunk_index: number
          content: string
          embedding: string
          id: string
          timestamp_fim_segundos: number | null
          timestamp_inicio_segundos: number | null
          video_aula_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          embedding: string
          id?: string
          timestamp_fim_segundos?: number | null
          timestamp_inicio_segundos?: number | null
          video_aula_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          embedding?: string
          id?: string
          timestamp_fim_segundos?: number | null
          timestamp_inicio_segundos?: number | null
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_embeddings_fk"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
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
      debug_auth_cartorio_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_cartorios_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          cartorio_id: string
          cartorio_nome: string
          cartorio_ativo: boolean
          tokens_count: number
          usuarios_count: number
          tokens_ativos: number
          tokens_expirados: number
        }[]
      }
      get_current_cartorio_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_cartorio_id_from_jwt: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_cartorio_usuario_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_product_progress: {
        Args: { p_produto_id: string; p_cartorio_id: string }
        Returns: Json
      }
      get_user_progress_by_cartorio: {
        Args: { p_cartorio_id: string }
        Returns: {
          user_id: string
          username: string
          email: string
          is_active: boolean
          produto_id: string
          produto_nome: string
          sistema_nome: string
          total_aulas: number
          aulas_concluidas: number
          percentual: number
        }[]
      }
      get_user_progress_by_cartorio_with_permissions: {
        Args: { p_cartorio_id: string }
        Returns: {
          user_id: string
          username: string
          email: string
          is_active: boolean
          produto_id: string
          produto_nome: string
          sistema_nome: string
          total_aulas: number
          aulas_concluidas: number
          percentual: number
        }[]
      }
      get_visualizacao_cartorio: {
        Args: { p_cartorio_id: string; p_video_aula_id: string }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      registrar_visualizacao_cartorio: {
        Args: {
          p_video_aula_id: string
          p_completo?: boolean
          p_concluida?: boolean
          p_data_conclusao?: string
        }
        Returns: Json
      }
      registrar_visualizacao_cartorio_robust: {
        Args: {
          p_video_aula_id: string
          p_completo?: boolean
          p_concluida?: boolean
          p_data_conclusao?: string
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
      test_cartorio_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_insert_visualizacao_cartorio: {
        Args: {
          p_cartorio_id: string
          p_video_aula_id: string
          p_completo?: boolean
          p_concluida?: boolean
          p_data_conclusao?: string
        }
        Returns: Json
      }
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
