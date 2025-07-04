export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          username: string
        }
        Insert: {
          cartorio_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          username: string
        }
        Update: {
          cartorio_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
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
      rls_debug_log: {
        Row: {
          auth_uid_returned_value: string | null
          called_function: string | null
          get_cartorio_id_returned_value: string | null
          id: number
          jwt_claims: Json | null
          message: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          auth_uid_returned_value?: string | null
          called_function?: string | null
          get_cartorio_id_returned_value?: string | null
          id?: number
          jwt_claims?: Json | null
          message?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          auth_uid_returned_value?: string | null
          called_function?: string | null
          get_cartorio_id_returned_value?: string | null
          id?: number
          jwt_claims?: Json | null
          message?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      video_aulas: {
        Row: {
          descricao: string | null
          id: string
          id_video_bunny: string | null
          ordem: number
          produto_id: string | null
          titulo: string
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
          video_aula_id: string
        }
        Insert: {
          cartorio_id: string
          completo?: boolean
          concluida?: boolean | null
          data_conclusao?: string | null
          id?: string
          video_aula_id: string
        }
        Update: {
          cartorio_id?: string
          completo?: boolean
          concluida?: boolean | null
          data_conclusao?: string | null
          id?: string
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
      get_current_cartorio_usuario_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_product_progress: {
        Args: { p_produto_id: string; p_cartorio_id: string }
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
      set_test_cartorio_id: {
        Args: { cartorio_id_param: string }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
